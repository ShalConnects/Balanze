// =====================================================
// TEST AUTH STORE FUNCTIONALITY
// =====================================================

// Test the auth store signUp function
async function testAuthStore() {
  console.log('=== TESTING AUTH STORE ===');
  
  // Test data
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    console.log('1. Testing Supabase connection...');
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
      console.error('❌ Supabase Auth Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return false;
    }
    
    console.log('✅ Supabase Auth successful');
    console.log('User ID:', data.user?.id);
    
    // Test profile creation
    if (data.user) {
      console.log('2. Testing profile creation...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: testFullName,
          local_currency: 'USD',
          role: 'user',
          subscription: {
            plan: 'free',
            status: 'active',
            validUntil: null
          }
        });
      
      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        return false;
      }
      
      console.log('✅ Profile creation successful');
    }
    
    console.log('✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testAuthStore().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
}); 