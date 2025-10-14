import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xgncksougafnfbtusfnf.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk'
);

async function testSMTPConfiguration() {
  try {
    // Test 1: Try to send a test email
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      'test@example.com',
      {
        redirectTo: 'https://balanze.cash'
      }
    );
    
    if (error) {
      if (error.message.includes('rate limit')) {
        // Rate limit detected - SMTP may not be configured yet
      } else {
        // Email service error
      }
    } else {
      // SMTP Test Successful!
    }
    
  } catch (error) {
    // Test failed
  }
}

// Run the test
testSMTPConfiguration().then(() => {
  // Test Complete
}); 