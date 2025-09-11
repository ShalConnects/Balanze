import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordReset() {
  console.log('=== Testing Password Reset Functionality ===\n');
  
  const testEmail = 'shalconnect00@gmail.com';
  
  try {
    console.log(`📧 Requesting password reset for: ${testEmail}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5173/auth/reset-password'
    });
    
    if (error) {
      console.log('❌ Password reset request failed:');
      console.log('Error:', error.message);
      console.log('Status:', error.status);
      console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('Data:', data);
      console.log('\n📝 Next steps:');
      console.log('1. Check the email inbox for the reset link');
      console.log('2. Click the link to go to the reset password page');
      console.log('3. Enter a new password');
      console.log('4. Test logging in with the new password');
    }
    
  } catch (error) {
    console.log('❌ Exception during password reset:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

testPasswordReset(); 