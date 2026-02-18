import { supabase } from '../lib/supabaseServer.js';
import nodemailer from 'nodemailer';

/** Reuse same SMTP as last-wish / year-summary */
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const BLOG_POST_PATH = '/blog/ramadan-habits-with-balanze';
const BASE_URL = process.env.SITE_URL || process.env.VITE_APP_URL || 'https://balanze.cash';
const BLOG_URL = `${BASE_URL.replace(/\/$/, '')}${BLOG_POST_PATH}`;

function buildEmailHtml(userEmail) {
  const name = userEmail?.split('@')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#333;">
  <p>Hi ${name},</p>
  <p>We just published a new post on the Balanze blog.</p>
  <p><strong>Ramadan with Balanze: Build Habits That Last</strong></p>
  <p>Use the Habit Garden to stay consistent with prayer, Quran, sadaqah, and more this Ramadan, and keep those habits after.</p>
  <p><a href="${BLOG_URL}" style="display:inline-block;background:linear-gradient(to right,#2563eb,#9333ea);color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600;">Read the post</a></p>
  <p style="margin-top:32px;font-size:13px;color:#666;">You're getting this because you have a Balanze account.</p>
</body>
</html>`;
}

export async function sendBlogAnnouncementToUser(user) {
  const to = user.email;
  if (!to || !to.includes('@')) return { success: false, error: 'No email', userId: user.id };

  if (!transporter) return { success: false, error: 'SMTP not configured', userId: user.id };

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'New on the Balanze Blog: Ramadan with Balanze',
      html: buildEmailHtml(to),
    });
    return { success: true, userId: user.id };
  } catch (err) {
    return { success: false, error: err.message, userId: user.id };
  }
}

/** Run the send locally (no HTTP/auth). Use from send-blog-announce-local.js. */
export async function runBlogAnnouncement() {
  if (!supabase) throw new Error('Supabase not configured (SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local)');
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  const users = (data?.users || []).filter((u) => u.email);
  if (users.length === 0) return { success: true, message: 'No users with email', stats: { total: 0, sent: 0, failed: 0, errors: [] } };
  const stats = { total: users.length, sent: 0, failed: 0, errors: [] };
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((u) => sendBlogAnnouncementToUser(u)));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled' && r.value.success) stats.sent++;
      else { stats.failed++; stats.errors.push({ email: batch[j].email, error: r.status === 'fulfilled' ? r.value.error : r.reason?.message }); }
    });
    if (i + batchSize < users.length) await new Promise((r) => setTimeout(r, 1500));
  }
  return { success: true, message: 'Blog announcement sent', stats };
}

/**
 * Trigger: POST with same secret as last-wish (manual-trigger).
 * Header: Authorization: Bearer <CRON_SECRET or LAST_WISH_TRIGGER_SECRET>
 * Or run locally: node send-blog-announce-local.js (no secret; uses .env.local)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.CRON_SECRET || process.env.LAST_WISH_TRIGGER_SECRET;
  const auth = req.headers.authorization;
  if (!secret || auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });
  if (!supabase) return res.status(503).json({ error: 'Server configuration error' });

  try {
    const result = await runBlogAnnouncement();
    return res.status(200).json(result);
  } catch (err) {
    console.error('send-blog-announcement-email:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
