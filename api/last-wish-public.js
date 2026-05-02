import { supabase } from '../lib/supabaseServer.js';

export default async function handler(req, res) {
  // Allow both GET and POST for testing and cron jobs
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (!supabase) {
    return res.status(503).json({ error: 'Server configuration error' });
  }
  try {
    const TARGET_USER_ID = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    const TARGET_EMAIL = 'salauddin.kader406@gmail.com';
    
    
    // Check for overdue users
    let overdueUsers = [];
    
    try {
      const { data, error } = await supabase.rpc('check_overdue_last_wish');
      
      if (error) {
        console.error(`[LAST-WISH-PUBLIC] RPC Error:`, error);
        throw error;
      }
      
      
      if (Array.isArray(data)) {
        overdueUsers = data;
      } else if (typeof data === 'object' && data !== null) {
        overdueUsers = [data];
      }
      
      // Check if target user is in the list
      const targetUserFound = overdueUsers.some(u => u.user_id === TARGET_USER_ID);
      if (targetUserFound) {
        const targetUser = overdueUsers.find(u => u.user_id === TARGET_USER_ID);
      }
    } catch (rpcError) {
      console.error(`[LAST-WISH-PUBLIC] RPC failed, using fallback query. Error:`, rpcError);
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
        console.error(`[LAST-WISH-PUBLIC] Direct query error:`, directError);
        throw directError;
      }
      
      
      // Check if target user is in direct data
      const targetUserInDirect = directData?.find(r => r.user_id === TARGET_USER_ID);
      if (targetUserInDirect) {
      }
      
      // Calculate overdue users manually
      overdueUsers = directData
        .filter(record => {
          const lastCheckIn = new Date(record.last_check_in);
          const nextCheckIn = new Date(lastCheckIn.getTime() + (record.check_in_frequency * 24 * 60 * 60 * 1000));
          const now = new Date();
          const isOverdue = now > nextCheckIn;
          
          if (record.user_id === TARGET_USER_ID) {
          }
          
          return isOverdue;
        })
        .map(record => {
          const lastCheckInTime = new Date(record.last_check_in).getTime();
          const frequencyMs = record.check_in_frequency * 24 * 60 * 60 * 1000;
          const expectedCheckInTime = lastCheckInTime + frequencyMs;
          const now = new Date().getTime();
          const diffTime = now - expectedCheckInTime;
          return {
            user_id: record.user_id,
            email: 'unknown@example.com',
            days_overdue: diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0
          };
        });
      
    }

    // Process overdue users and send emails
    const emailResults = [];
    
    
    for (const user of overdueUsers) {
      const isTargetUser = user.user_id === TARGET_USER_ID;
      
      if (isTargetUser) {
      }
      
      try {
        if (isTargetUser) {
        }
        
        // Import the email sending function from the API
        const { default: sendLastWishEmailHandler } = await import('./send-last-wish-email.js');
        
        if (isTargetUser) {
        }
        
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
              if (isTargetUser) {
              }
            }
          }),
          setHeader: () => {},
          end: () => {}
        };
        
        if (isTargetUser) {
        }
        
        // Call the email handler
        await sendLastWishEmailHandler(mockReq, mockRes);
        
        if (isTargetUser) {
        }
        
        if (emailResult && emailResult.success) {
          if (isTargetUser) {
          }
          
          emailResults.push({
            user_id: user.user_id,
            success: true,
            message: emailResult.message
          });
          
          // Note: delivery_triggered is already set by the email handler to prevent duplicates
          // No need to update here to avoid race conditions
        } else if (emailResult && emailResult.skipped) {
          if (isTargetUser) {
          }
          
          emailResults.push({
            user_id: user.user_id,
            success: false,
            skipped: true,
            message: emailResult.message || 'Already triggered'
          });
        } else {
          if (isTargetUser) {
            console.error(`[LAST-WISH-PUBLIC] ❌ Email failed for target user. Error:`, emailResult?.error || 'Unknown error');
          }
          
          emailResults.push({
            user_id: user.user_id,
            success: false,
            error: emailResult?.error || 'Unknown error'
          });
        }
        
      } catch (emailError) {
        if (isTargetUser) {
          console.error(`[LAST-WISH-PUBLIC] ❌ Exception while processing target user:`, emailError);
          console.error(`[LAST-WISH-PUBLIC] Error stack:`, emailError.stack);
        }
        
        emailResults.push({
          user_id: user.user_id,
          success: false,
          error: emailError.message
        });
      }
    }

    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.filter(r => !r.success).length;
    
    const targetUserResult = emailResults.find(r => r.user_id === TARGET_USER_ID);
    if (targetUserResult) {
    }
    
    
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