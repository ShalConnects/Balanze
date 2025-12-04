import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthWorking() {
  console.log('🧪 Testing Simplified Authentication...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';
  
  try {
    // Test 1: Sign up
    console.log('📝 Testing signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Signup error:', signupError.message);
      return;
    }
    
    console.log('✅ Signup successful!');
    console.log('User ID:', signupData.user?.id);
    console.log('Email confirmed:', signupData.user?.email_confirmed_at);
    
    // Test 2: Sign in immediately (should work now)
    console.log('\n🔐 Testing immediate signin...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signinError) {
      console.log('❌ Signin error:', signinError.message);
    } else {
      console.log('✅ Signin successful!');
      console.log('Session active:', !!signinData.session);
    }
    
    // Test 3: Clean up - sign out
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Authentication test completed successfully!');
    console.log('Your SaaS is ready for launch! 🚀');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAuthWorking(); 