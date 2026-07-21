import { supabase } from '../lib/supabaseServer.js';
import { isLastWishTriggerAuthorized } from '../lib/lastWishTriggerAuth.js';
import { sendLastWishEmail } from './send-last-wish-email.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (!applyCors(req, res, { methods: 'GET, POST, OPTIONS', headers: 'Content-Type, Authorization' })) {
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isLastWishTriggerAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!supabase) {
    return res.status(503).json({ error: 'Server configuration error' });
  }

  try {
    let overdueUsers = [];

    try {
      const { data, error } = await supabase.rpc('check_overdue_last_wish');
      if (error) throw error;
      if (Array.isArray(data)) overdueUsers = data;
      else if (data && typeof data === 'object') overdueUsers = [data];
    } catch (rpcError) {
      console.error(`[LAST-WISH-PUBLIC] RPC failed, using fallback query. Error:`, rpcError);
      const { data: directData, error: directError } = await supabase
        .from('last_wish_settings')
        .select('user_id, check_in_frequency, last_check_in, delivery_triggered')
        .eq('is_enabled', true)
        .eq('is_active', true)
        .eq('delivery_triggered', false)
        .not('last_check_in', 'is', null);

      if (directError) throw directError;

      const now = Date.now();
      overdueUsers = (directData || [])
        .filter((record) => {
          const lastCheckIn = new Date(record.last_check_in).getTime();
          return now > lastCheckIn + record.check_in_frequency * 24 * 60 * 60 * 1000;
        })
        .map((record) => {
          const expected =
            new Date(record.last_check_in).getTime() +
            record.check_in_frequency * 24 * 60 * 60 * 1000;
          const diffTime = now - expected;
          return {
            user_id: record.user_id,
            days_overdue: diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0,
          };
        });
    }

    const emailResults = [];
    for (const user of overdueUsers) {
      try {
        const emailResult = await sendLastWishEmail(user.user_id, false);
        if (emailResult?.success) {
          emailResults.push({
            user_id: user.user_id,
            success: true,
            message: emailResult.message,
          });
        } else if (emailResult?.skipped) {
          emailResults.push({
            user_id: user.user_id,
            success: false,
            skipped: true,
            message: emailResult.message || 'Already triggered',
          });
        } else {
          emailResults.push({
            user_id: user.user_id,
            success: false,
            error: emailResult?.error || 'Unknown error',
          });
        }
      } catch (emailError) {
        emailResults.push({
          user_id: user.user_id,
          success: false,
          error: emailError.message,
        });
      }
    }

    const successfulEmails = emailResults.filter((r) => r.success).length;
    const failedEmails = emailResults.filter((r) => !r.success).length;

    res.status(200).json({
      success: true,
      processedCount: overdueUsers.length,
      emailsSent: successfulEmails,
      emailsFailed: failedEmails,
      message: `Processed ${overdueUsers.length} overdue users, sent ${successfulEmails} emails`,
      timestamp: new Date().toISOString(),
      overdueUsers: overdueUsers.map((u) => ({
        user_id: u.user_id,
        days_overdue: u.days_overdue,
      })),
      emailResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
