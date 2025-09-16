import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Allow both GET and POST for testing and cron jobs
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Starting Last Wish service...');
    
    // Check for overdue users
    let overdueUsers = [];
    
    try {
      const { data, error } = await supabase.rpc('check_overdue_last_wish');
      
      if (error) {
        throw error;
      }
      
      if (Array.isArray(data)) {
        overdueUsers = data;
      } else if (typeof data === 'object' && data !== null) {
        overdueUsers = [data];
      }
    } catch (rpcError) {
      console.log(`RPC function failed, trying direct query: ${rpcError.message}`);
      
      // Fallback to direct query
      const { data: directData, error: directError } = await supabase
        .from('last_wish_settings')
        .select(`
          user_id,
          check_in_frequency,
          last_check_in
        `)
        .eq('is_enabled', true)
        .eq('is_active', true)
        .not('last_check_in', 'is', null);
      
      if (directError) {
        throw directError;
      }
      
      // Calculate overdue users manually
      overdueUsers = directData
        .filter(record => {
          const lastCheckIn = new Date(record.last_check_in);
          const nextCheckIn = new Date(lastCheckIn.getTime() + (record.check_in_frequency * 24 * 60 * 60 * 1000));
          const now = new Date();
          return now > nextCheckIn;
        })
        .map(record => ({
          user_id: record.user_id,
          email: 'unknown@example.com',
          days_overdue: Math.floor((new Date() - new Date(record.last_check_in + (record.check_in_frequency * 24 * 60 * 60 * 1000))) / (1000 * 60 * 60 * 24))
        }));
    }

    console.log(`Found ${overdueUsers.length} overdue users`);

    // For now, just log the overdue users
    // In a real implementation, you would process them and send emails
    for (const user of overdueUsers) {
      console.log(`Overdue user: ${user.email} (${user.days_overdue} days overdue)`);
      
      // Mark as delivered to prevent duplicate processing
      await supabase
        .from('last_wish_settings')
        .update({ is_active: false })
        .eq('user_id', user.user_id);
    }

    console.log(`Service completed. Processed ${overdueUsers.length} users.`);
    
    res.status(200).json({ 
      success: true, 
      processedCount: overdueUsers.length,
      message: `Found ${overdueUsers.length} overdue users`,
      timestamp: new Date().toISOString(),
      overdueUsers: overdueUsers.map(u => ({ user_id: u.user_id, days_overdue: u.days_overdue }))
    });
  } catch (error) {
    console.error(`Service failed: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 