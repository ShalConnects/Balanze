import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get overdue users
    const { data: overdueUsers, error: rpcError } = await supabase.rpc('check_overdue_last_wish');
    
    // Get user settings for the specific user
    const userId = req.query.userId || 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get delivery logs
    const { data: deliveries, error: deliveryError } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Check SMTP configuration
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      overdueUsers: overdueUsers || [],
      rpcError: rpcError?.message,
      userSettings: settings ? {
        is_enabled: settings.is_enabled,
        is_active: settings.is_active,
        delivery_triggered: settings.delivery_triggered,
        check_in_frequency: settings.check_in_frequency,
        last_check_in: settings.last_check_in,
        recipient_count: settings.recipients?.length || 0,
        hours_overdue: settings.last_check_in ? 
          ((new Date() - new Date(settings.last_check_in + settings.check_in_frequency * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60)).toFixed(2) : null
      } : null,
      settingsError: settingsError?.message,
      deliveries: deliveries || [],
      deliveryError: deliveryError?.message,
      smtpConfigured: smtpConfigured,
      smtpHost: process.env.SMTP_HOST || 'Not set',
      smtpUser: process.env.SMTP_USER ? 'Set' : 'Not set',
      smtpPass: process.env.SMTP_PASS ? 'Set' : 'Not set'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

