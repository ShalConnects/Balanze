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
    const TARGET_USER_ID = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    const TARGET_EMAIL = 'salauddin.kader406@gmail.com';
    
    console.log(`[LAST-WISH-PUBLIC] Starting check at ${new Date().toISOString()}`);
    
    // Check for overdue users
    let overdueUsers = [];
    
    try {
      console.log(`[LAST-WISH-PUBLIC] Calling check_overdue_last_wish() RPC function...`);
      const { data, error } = await supabase.rpc('check_overdue_last_wish');
      
      if (error) {
        console.error(`[LAST-WISH-PUBLIC] RPC Error:`, error);
        throw error;
      }
      
      console.log(`[LAST-WISH-PUBLIC] RPC returned:`, JSON.stringify(data, null, 2));
      
      if (Array.isArray(data)) {
        overdueUsers = data;
      } else if (typeof data === 'object' && data !== null) {
        overdueUsers = [data];
      }
      
      // Check if target user is in the list
      const targetUserFound = overdueUsers.some(u => u.user_id === TARGET_USER_ID);
      console.log(`[LAST-WISH-PUBLIC] Target user ${TARGET_EMAIL} (${TARGET_USER_ID}) found in overdue list: ${targetUserFound}`);
      if (targetUserFound) {
        const targetUser = overdueUsers.find(u => u.user_id === TARGET_USER_ID);
        console.log(`[LAST-WISH-PUBLIC] Target user details:`, JSON.stringify(targetUser, null, 2));
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
      
      console.log(`[LAST-WISH-PUBLIC] Fallback query found ${directData?.length || 0} active users`);
      
      // Check if target user is in direct data
      const targetUserInDirect = directData?.find(r => r.user_id === TARGET_USER_ID);
      if (targetUserInDirect) {
        console.log(`[LAST-WISH-PUBLIC] Target user found in direct query:`, JSON.stringify(targetUserInDirect, null, 2));
      }
      
      // Calculate overdue users manually
      overdueUsers = directData
        .filter(record => {
          const lastCheckIn = new Date(record.last_check_in);
          const nextCheckIn = new Date(lastCheckIn.getTime() + (record.check_in_frequency * 24 * 60 * 60 * 1000));
          const now = new Date();
          const isOverdue = now > nextCheckIn;
          
          if (record.user_id === TARGET_USER_ID) {
            console.log(`[LAST-WISH-PUBLIC] Target user overdue check:`, {
              lastCheckIn: lastCheckIn.toISOString(),
              nextCheckIn: nextCheckIn.toISOString(),
              now: now.toISOString(),
              isOverdue,
              hoursOverdue: isOverdue ? (now - nextCheckIn) / (1000 * 60 * 60) : 0
            });
          }
          
          return isOverdue;
        })
        .map(record => ({
          user_id: record.user_id,
          email: 'unknown@example.com',
          days_overdue: Math.floor((new Date() - new Date(record.last_check_in + (record.check_in_frequency * 24 * 60 * 60 * 1000))) / (1000 * 60 * 60 * 24))
        }));
      
      console.log(`[LAST-WISH-PUBLIC] After filtering, ${overdueUsers.length} overdue users found`);
    }

    // Process overdue users and send emails
    const emailResults = [];
    
    console.log(`[LAST-WISH-PUBLIC] Processing ${overdueUsers.length} overdue users...`);
    
    for (const user of overdueUsers) {
      const isTargetUser = user.user_id === TARGET_USER_ID;
      
      if (isTargetUser) {
        console.log(`[LAST-WISH-PUBLIC] 🎯 PROCESSING TARGET USER: ${TARGET_EMAIL} (${TARGET_USER_ID})`);
        console.log(`[LAST-WISH-PUBLIC] User data:`, JSON.stringify(user, null, 2));
      }
      
      try {
        if (isTargetUser) {
          console.log(`[LAST-WISH-PUBLIC] Importing send-last-wish-email handler...`);
        }
        
        // Import the email sending function from the API
        const { default: sendLastWishEmailHandler } = await import('./send-last-wish-email.js');
        
        if (isTargetUser) {
          console.log(`[LAST-WISH-PUBLIC] Handler imported successfully, creating mock request/response...`);
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
                console.log(`[LAST-WISH-PUBLIC] Email handler response:`, JSON.stringify(emailResult, null, 2));
              }
            }
          }),
          setHeader: () => {},
          end: () => {}
        };
        
        if (isTargetUser) {
          console.log(`[LAST-WISH-PUBLIC] Calling email handler for target user...`);
        }
        
        // Call the email handler
        await sendLastWishEmailHandler(mockReq, mockRes);
        
        if (isTargetUser) {
          console.log(`[LAST-WISH-PUBLIC] Email handler completed. Result:`, JSON.stringify(emailResult, null, 2));
        }
        
        if (emailResult && emailResult.success) {
          if (isTargetUser) {
            console.log(`[LAST-WISH-PUBLIC] ✅ Email sent successfully for target user!`);
          }
          
          emailResults.push({
            user_id: user.user_id,
            success: true,
            message: emailResult.message
          });
          
          // Mark as delivered to prevent duplicate processing
          const updateResult = await supabase
            .from('last_wish_settings')
            .update({ delivery_triggered: true })
            .eq('user_id', user.user_id);
          
          if (isTargetUser) {
            console.log(`[LAST-WISH-PUBLIC] Update delivery_triggered result:`, JSON.stringify(updateResult, null, 2));
          }
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
      console.log(`[LAST-WISH-PUBLIC] 🎯 FINAL RESULT FOR TARGET USER:`, JSON.stringify(targetUserResult, null, 2));
    }
    
    console.log(`[LAST-WISH-PUBLIC] Summary: ${overdueUsers.length} overdue, ${successfulEmails} sent, ${failedEmails} failed`);
    
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