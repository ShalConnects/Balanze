import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required in request body' 
      });
    }

    // Check if user is overdue
    const { data: overdueCheck, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');

    if (overdueError) {
      console.error('Error checking overdue users:', overdueError);
    }

    const isOverdue = overdueCheck?.some(user => user.user_id === userId);

    if (!isOverdue) {
      // Check manually if user should be overdue
      const { data: settings, error: settingsError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .eq('is_active', true)
        .single();

      if (settingsError || !settings) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found or Last Wish not enabled' 
        });
      }

      const lastCheckIn = new Date(settings.last_check_in);
      const nextCheckIn = new Date(lastCheckIn.getTime() + (settings.check_in_frequency * 24 * 60 * 60 * 1000));
      const now = new Date();

      if (now <= nextCheckIn) {
        return res.status(400).json({ 
          success: false, 
          error: 'User is not overdue yet',
          nextCheckIn: nextCheckIn.toISOString(),
          currentTime: now.toISOString()
        });
      }
    }

    // Import and call the email sending function
    const { default: sendLastWishEmailHandler } = await import('./send-last-wish-email.js');
    
    // Create a mock request/response for the email handler
    const mockReq = {
      method: 'POST',
      body: {
        userId: userId,
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
      // Mark as delivered to prevent duplicate processing
      await supabase
        .from('last_wish_settings')
        .update({ delivery_triggered: true })
        .eq('user_id', userId);

      return res.status(200).json({ 
        success: true, 
        message: 'Last Wish email triggered successfully',
        result: emailResult,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: emailResult?.error || 'Failed to send email',
        details: emailResult,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in manual trigger:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

