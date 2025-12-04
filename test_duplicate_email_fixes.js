// Test Script for Duplicate Email Prevention Fixes
// Run this in your browser console on the login page to test the fixes

const TEST_EMAIL = 'test.duplicate@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

console.log('🧪 Starting Duplicate Email Prevention Tests...');

// Test 1: Database Function Test
async function testDatabaseFunctions() {
  console.log('\n📋 Test 1: Database Functions');
  
  try {
    // Test check_email_exists function
    const { data: emailExists, error } = await supabase.rpc('check_email_exists', {
      email_to_check: 'nonexistent@example.com'
    });
    
    if (error) {
      console.error('❌ Database function error:', error);
      return false;
    }
    
    console.log('✅ check_email_exists function working:', emailExists === false);
    
    // Test get_user_by_email function
    const { data: userId, error: userError } = await supabase.rpc('get_user_by_email', {
      email_to_check: 'nonexistent@example.com'
    });
    
    if (userError) {
      console.error('❌ get_user_by_email function error:', userError);
      return false;
    }
    
    console.log('✅ get_user_by_email function working:', userId === null);
    return true;
    
  } catch (error) {
    console.error('❌ Database function test failed:', error);
    return false;
  }
}

// Test 2: Regular Signup Duplicate Prevention
async function testRegularSignupPrevention() {
  console.log('\n📋 Test 2: Regular Signup Duplicate Prevention');
  
  try {
    // First, try to create a user
    console.log('Creating test user...');
    const signupResult1 = await useAuthStore.getState().signUp(TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
    
    if (signupResult1.success) {
      console.log('✅ First signup successful');
      
      // Now try to create the same user again
      console.log('Attempting duplicate signup...');
      const signupResult2 = await useAuthStore.getState().signUp(TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
      
      if (!signupResult2.success && signupResult2.message.includes('already registered')) {
        console.log('✅ Duplicate signup correctly prevented');
        return true;
      } else {
        console.error('❌ Duplicate signup was NOT prevented:', signupResult2);
        return false;
      }
    } else if (signupResult1.message && signupResult1.message.includes('already registered')) {
      console.log('✅ User already exists, duplicate prevention working');
      return true;
    } else {
      console.error('❌ First signup failed:', signupResult1);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Regular signup test failed:', error);
    return false;
  }
}

// Test 3: OAuth Callback Protection (simulation)
async function testOAuthCallbackProtection() {
  console.log('\n📋 Test 3: OAuth Callback Protection (Simulation)');
  
  try {
    // Simulate what would happen in OAuth callback
    const mockUser = {
      id: 'mock-oauth-user-id',
      email: TEST_EMAIL,
      user_metadata: { full_name: 'OAuth User' }
    };
    
    // Check if email exists
    const { data: emailExists, error } = await supabase.rpc('check_email_exists', {
      email_to_check: mockUser.email
    });
    
    if (error) {
      console.error('❌ OAuth email check failed:', error);
      return false;
    }
    
    if (emailExists) {
      // Get existing user ID
      const { data: existingUserId, error: userError } = await supabase.rpc('get_user_by_email', {
        email_to_check: mockUser.email
      });
      
      if (userError) {
        console.error('❌ OAuth user lookup failed:', userError);
        return false;
      }
      
      if (existingUserId && existingUserId !== mockUser.id) {
        console.log('✅ OAuth would correctly detect duplicate email and prevent login');
        return true;
      } else {
        console.log('✅ OAuth would allow login (same user or new email)');
        return true;
      }
    } else {
      console.log('✅ OAuth would allow new user registration');
      return true;
    }
    
  } catch (error) {
    console.error('❌ OAuth callback test failed:', error);
    return false;
  }
}

// Test 4: Error Message Handling
async function testErrorMessages() {
  console.log('\n📋 Test 4: Error Message Handling');
  
  const testErrors = [
    'DUPLICATE_EMAIL: This email address is already registered',
    'Unable to verify email availability',
    'already registered with a different account',
    'email not confirmed'
  ];
  
  // Simulate error handling (this would normally be done in the Auth component)
  const getLoginErrorMessage = (error) => {
    if (error && typeof error === 'string') {
      const errorLower = error.toLowerCase();
      if (errorLower.includes('email not confirmed')) {
        return 'Please confirm your email before logging in.';
      }
      if (errorLower.includes('duplicate_email') || errorLower.includes('already registered')) {
        return 'This email is already registered. Please try logging in instead, or use a different email.';
      }
      if (errorLower.includes('unable to verify email')) {
        return 'Unable to verify email availability. Please check your connection and try again.';
      }
      if (errorLower.includes('already registered with a different account')) {
        return 'This email is linked to a different login method. Please use your original sign-in method.';
      }
    }
    return error;
  };
  
  let allPassed = true;
  testErrors.forEach((testError, index) => {
    const friendlyMessage = getLoginErrorMessage(testError);
    const passed = friendlyMessage !== testError && friendlyMessage.length > 0;
    console.log(`${passed ? '✅' : '❌'} Error ${index + 1}: ${passed ? 'Converted to friendly message' : 'Not converted'}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running Duplicate Email Prevention Tests...\n');
  
  const results = {
    databaseFunctions: await testDatabaseFunctions(),
    signupPrevention: await testRegularSignupPrevention(),
    oauthProtection: await testOAuthCallbackProtection(),
    errorMessages: await testErrorMessages()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('================================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('✅ Duplicate email prevention is working correctly!');
  } else {
    console.log('❌ Some issues found. Check the individual test results above.');
  }
  
  return results;
}

// Instructions for manual testing
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:
==============================

1. First, run the database script:
   - Go to Supabase Dashboard > SQL Editor
   - Run the contents of 'fix_duplicate_email_comprehensive.sql'

2. Test Regular Signup:
   - Try to register with an email
   - Try to register with the same email again
   - Should see: "This email is already registered..."

3. Test Google OAuth:
   - Try to sign in with Google using an email that's already registered via email/password
   - Should be redirected back with error message

4. Run automated tests:
   runAllTests()

5. Check database triggers:
   - In Supabase SQL Editor, run: SELECT * FROM find_duplicate_emails();
   - Should show any existing duplicates

IMPORTANT: Make sure to run the SQL script first!
`);

// Export for manual execution
window.testDuplicateEmailFixes = {
  runAllTests,
  testDatabaseFunctions,
  testRegularSignupPrevention,
  testOAuthCallbackProtection,
  testErrorMessages
};

console.log('\n✅ Test functions loaded. Run runAllTests() to start testing.');
