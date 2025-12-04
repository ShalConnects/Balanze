import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordResetWithDifferentEmail() {
  console.log('=== Testing Password Reset with Different Email ===\n');
  
  // Use a different email to avoid rate limiting
  const testEmail = 'test-reset-' + Date.now() + '@example.com';
  
  try {
    console.log(`📧 Requesting password reset for: ${testEmail}`);
    console.log('Note: This email likely doesn\'t exist, but it will test the rate limiting');
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5173/auth/reset-password'
    });
    
    if (error) {
      console.log('❌ Password reset request failed:');
      console.log('Error:', error.message);
      console.log('Status:', error.status);
      
      if (error.message.includes('rate limit') || error.status === 429) {
        console.log('\n🔍 Rate Limit Analysis:');
        console.log('- This confirms rate limiting is active');
        console.log('- Wait 1-2 minutes before trying again');
        console.log('- Or use a completely different email address');
      } else if (error.message.includes('email not found')) {
        console.log('\n✅ This is expected behavior:');
        console.log('- Email doesn\'t exist, but no rate limit error');
        console.log('- Rate limiting is working correctly');
      }
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.log('❌ Exception during password reset:', error);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\n📝 Next Steps:');
  console.log('1. Wait 1-2 minutes before testing again');
  console.log('2. Use a different email address');
  console.log('3. Check Supabase Dashboard for rate limit settings');
}

testPasswordResetWithDifferentEmail(); 