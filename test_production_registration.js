import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testProductionRegistration() {
  console.log('=== PRODUCTION REGISTRATION TEST ===');
  
  const testCases = [
    {
      name: 'Standard Registration',
      email: `test${Date.now()}@gmail.com`,
      password: 'TestPassword123!',
      fullName: 'Test User'
    },
    {
      name: 'Registration with Special Characters',
      email: `test.special${Date.now()}@yahoo.com`,
      password: 'TestPassword123!',
      fullName: 'José María O\'Connor-Smith'
    },
    {
      name: 'Registration without Full Name',
      email: `test.noname${Date.now()}@outlook.com`,
      password: 'TestPassword123!',
      fullName: undefined
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    
    try {
      // Test 1: User Registration
      console.log('1. Testing user registration...');
      
      const { data, error } = await supabase.auth.signUp({
        email: testCase.email,
        password: testCase.password,
        options: {
          data: testCase.fullName ? {
            full_name: testCase.fullName
          } : {}
        }
      });
      
      if (error) {
        console.error(`❌ Registration failed:`, error);
        results.push({ testCase, success: false, error: error.message });
        continue;
      }
      
      console.log('✅ User registration successful');
      console.log('User ID:', data.user?.id);
      
      // Test 2: Profile Creation Check
      if (data.user) {
        console.log('2. Checking profile creation...');
        
        // Wait a moment for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Profile check failed:', profileError);
          results.push({ testCase, success: false, error: 'Profile not created' });
          continue;
        }
        
        console.log('✅ Profile created successfully');
        console.log('Profile data:', {
          id: profileData.id,
          full_name: profileData.full_name,
          local_currency: profileData.local_currency,
          role: profileData.role,
          subscription: profileData.subscription
        });
        
        // Test 3: Verify Profile Data
        console.log('3. Verifying profile data...');
        
        const expectedName = testCase.fullName || 'User';
        if (profileData.full_name !== expectedName) {
          console.error(`❌ Name mismatch: expected "${expectedName}", got "${profileData.full_name}"`);
          results.push({ testCase, success: false, error: 'Name mismatch' });
          continue;
        }
        
        if (profileData.local_currency !== 'USD') {
          console.error(`❌ Currency mismatch: expected "USD", got "${profileData.local_currency}"`);
          results.push({ testCase, success: false, error: 'Currency mismatch' });
          continue;
        }
        
        if (profileData.role !== 'user') {
          console.error(`❌ Role mismatch: expected "user", got "${profileData.role}"`);
          results.push({ testCase, success: false, error: 'Role mismatch' });
          continue;
        }
        
        console.log('✅ Profile data verification passed');
        results.push({ testCase, success: true });
        
        // Cleanup: Delete the test user
        console.log('4. Cleaning up test data...');
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
          console.log('✅ Test user deleted');
        } catch (cleanupError) {
          console.log('⚠️ Cleanup failed (this is normal for test users):', cleanupError.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ Test failed:`, error);
      results.push({ testCase, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.testCase.name}: ${result.error}`);
    });
  }
  
  if (passed === results.length) {
    console.log('\n🎉 ALL TESTS PASSED! Your SaaS registration system is production-ready!');
  } else {
    console.log('\n❌ Some tests failed. Please review the issues above.');
  }
  
  return passed === results.length;
}

// Run the test
testProductionRegistration().then(success => {
  console.log('\nFinal result:', success ? 'PRODUCTION READY' : 'NEEDS FIXING');
  process.exit(success ? 0 : 1);
}); 