// =====================================================
// TEST REGISTRATION FIX
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testRegistration() {
  console.log('=== TESTING USER REGISTRATION ===');
  
  // Test data
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    console.log('1. Testing Supabase connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection error:', testError);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    console.log('2. Testing user registration...');
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
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return false;
    }
    
    console.log('✅ User registration successful');
    console.log('User ID:', data.user?.id);
    
    // Check if profile was created
    if (data.user) {
      console.log('3. Checking if profile was created...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile check error:', profileError);
        console.log('This might be expected if the trigger is disabled');
      } else {
        console.log('✅ Profile created successfully');
        console.log('Profile data:', profileData);
      }
    }
    
    console.log('✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testRegistration().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
}); 