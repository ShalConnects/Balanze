// =====================================================
// TEST REGISTRATION FLOW WITH EMAIL CONFIRMATION
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testRegistrationFlow() {
  console.log('=== TESTING REGISTRATION FLOW ===');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    console.log('1. Testing user registration...');
    console.log('Email:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        }
      }
    });
    
    if (error) {
      console.error('❌ Registration error:', error);
      return false;
    }
    
    console.log('✅ User registration successful');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmed:', data.user?.email_confirmed_at);
    
    // Check if user is properly set (should be null for unconfirmed users)
    if (data.user && !data.user.email_confirmed_at) {
      console.log('✅ User created but email not confirmed (correct behavior)');
      
      // Test that we can't log in without email confirmation
      console.log('2. Testing login without email confirmation...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.log('✅ Login correctly blocked:', loginError.message);
      } else {
        console.error('❌ Login should have been blocked');
        return false;
      }
      
    } else if (data.user && data.user.email_confirmed_at) {
      console.log('✅ User created and email already confirmed');
    }
    
    console.log('✅ Registration flow test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testRegistrationFlow().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
}); 