// =====================================================
// TEST EMAIL CONFIRMATION STATUS
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testEmailConfirmationStatus() {
  console.log('=== TESTING EMAIL CONFIRMATION STATUS ===');
  
  const testEmail = `test-confirmation-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('1. Testing user registration...');
    console.log('Email:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
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
    console.log('Email:', data.user?.email);
    console.log('Created at:', data.user?.created_at);
    
    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      console.log('✅ Email confirmation is required (correct behavior)');
      
      // Test login attempt
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
      console.log('⚠️ WARNING: Email confirmation is DISABLED in Supabase');
      console.log('This means users can register without email confirmation');
      console.log('You should enable email confirmation in Supabase dashboard');
    }
    
    console.log('✅ Email confirmation test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testEmailConfirmationStatus().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
}); 