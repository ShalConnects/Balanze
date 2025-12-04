import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
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
      // Fallback to direct query
      const { data: directData, error: directError } = await supabase
        .from('last_wish_settings')
        .select(`
          user_id,
          check_in_frequency,
          last_check_in,
          delivery_triggered
        `)
        .eq('is_enabled', true)
        .eq('is_active', true)
        .eq('delivery_triggered', false)
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

    // Process overdue users and send emails
    const emailResults = [];
    
    for (const user of overdueUsers) {
      try {
        // Import the email sending function from the API
        const { default: sendLastWishEmailHandler } = await import('./send-last-wish-email.js');
        
        // Create a mock request/response for the email handler
        const mockReq = {
          method: 'POST',
          body: {
            userId: user.user_id,
            testMode: false
          }
        };
        
        let emailResult = null;
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              emailResult = { statusCode: code, ...data };
            }
          }),
          setHeader: () => {},
          end: () => {}
        };
        
        // Call the email handler
        await sendLastWishEmailHandler(mockReq, mockRes);
        
        if (emailResult && emailResult.success) {
          emailResults.push({
            user_id: user.user_id,
            success: true,
            message: emailResult.message
          });
          
          // Mark as delivered to prevent duplicate processing
          await supabase
            .from('last_wish_settings')
            .update({ delivery_triggered: true })
            .eq('user_id', user.user_id);
        } else {
          emailResults.push({
            user_id: user.user_id,
            success: false,
            error: emailResult?.error || 'Unknown error'
          });
        }
        
      } catch (emailError) {
        emailResults.push({
          user_id: user.user_id,
          success: false,
          error: emailError.message
        });
      }
    }

    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.filter(r => !r.success).length;
    
    res.status(200).json({ 
      success: true, 
      processedCount: overdueUsers.length,
      emailsSent: successfulEmails,
      emailsFailed: failedEmails,
      message: `Processed ${overdueUsers.length} overdue users, sent ${successfulEmails} emails`,
      timestamp: new Date().toISOString(),
      overdueUsers: overdueUsers.map(u => ({ user_id: u.user_id, days_overdue: u.days_overdue })),
      emailResults: emailResults
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 