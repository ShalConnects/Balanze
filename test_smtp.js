import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xgncksougafnfbtusfnf.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk'
);

async function testSMTPConfiguration() {
  console.log('=== SMTP Configuration Test ===');
  
  try {
    // Test 1: Try to send a test email
    console.log('1. Testing email service...');
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      'test@example.com',
      {
        redirectTo: 'https://balanze.cash'
      }
    );
    
    if (error) {
      console.error('❌ SMTP Test Failed:', error.message);
      
      if (error.message.includes('rate limit')) {
        console.log('⚠️  Rate limit detected - SMTP may not be configured yet');
        console.log('📧 Please configure SMTP in Supabase dashboard first');
      } else {
        console.log('❌ Email service error:', error.message);
      }
    } else {
      console.log('✅ SMTP Test Successful!');
      console.log('📧 Email service is working properly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSMTPConfiguration().then(() => {
  console.log('\n=== Test Complete ===');
  console.log('If you see errors, please configure SMTP in Supabase dashboard');
}); 