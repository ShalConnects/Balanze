import { supabase } from '../lib/supabaseServer.js';
import { normalizeIncludeData } from '../lib/lastWishIncludeData.js';
import { applyCors } from '../lib/cors.js';

function isDev() {
  return process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'production';
}

export default async function handler(req, res) {
  if (!applyCors(req, res, { methods: 'POST, OPTIONS', headers: 'Content-Type, Authorization' })) {
    return;
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!supabase) {
      return res.status(503).json({
        error:
          'Supabase is not configured on the API server. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_KEY in the environment used by `vercel dev`.',
        code: 'SUPABASE_MISSING',
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    const token = authHeader.slice(7);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const user = authData.user;

    let gatherUserData;
    let filterDataBySettings;
    let createPDFBuffer;
    let validateRecipients;
    try {
      const mod = await import('./send-last-wish-email.js');
      gatherUserData = mod.gatherUserData;
      filterDataBySettings = mod.filterDataBySettings;
      createPDFBuffer = mod.createPDFBuffer;
      validateRecipients = mod.validateRecipients;
    } catch (impErr) {
      const err = impErr instanceof Error ? impErr : new Error(String(impErr));
      console.error('[generate-last-wish-test-pdf] import send-last-wish-email failed', err);
      return res.status(500).json({
        error: err.message || 'Failed to load PDF module',
        code: 'PDF_MODULE_IMPORT',
        ...(isDev() && { detail: (err.stack || '').slice(0, 2500) }),
      });
    }

    const { data: lw, error: lwError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (lwError) throw lwError;
    if (!lw) {
      return res.status(404).json({
        error: 'Last Wish settings not found. Open Last Wish and save once, then try again.',
      });
    }

    const recipientValidation = validateRecipients(lw.recipients || []);
    const recipientsToSend =
      recipientValidation.validRecipients.length > 0
        ? recipientValidation.validRecipients
        : lw.recipients || [];
    if (!recipientsToSend.length) {
      return res.status(400).json({
        error: 'Add at least one recipient so the preview matches the PDF attached to delivery emails.',
      });
    }

    const rawIndex = Number(req.body?.recipientIndex);
    const recipientIndex =
      Number.isFinite(rawIndex) && rawIndex >= 0 ? Math.min(Math.floor(rawIndex), recipientsToSend.length - 1) : 0;
    const recipient = recipientsToSend[recipientIndex];

    // Same user record shape as sendLastWishEmail (admin API); fallback to JWT user if service role unavailable
    let pdfUser = user;
    try {
      const { data: adminUser, error: adminErr } = await supabase.auth.admin.getUserById(user.id);
      if (!adminErr && adminUser?.user) {
        pdfUser = adminUser.user;
      }
    } catch {
      // keep JWT user
    }

    const userData = await gatherUserData(user.id);
    const filtered = filterDataBySettings(userData, normalizeIncludeData(lw.include_data));

    const pdfBuffer = await createPDFBuffer(pdfUser, recipient, filtered, lw);

    const body = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="financial-data-backup.pdf"');
    return res.status(200).send(body);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[generate-last-wish-test-pdf]', err.message);
    console.error(err.stack);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(500).json({
        error: err.message || 'PDF generation failed',
        code: 'LAST_WISH_TEST_PDF',
        ...(isDev() && { detail: (err.stack || '').slice(0, 2500) }),
      });
    }
  }
}
