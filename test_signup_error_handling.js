import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupErrorHandling() {
  console.log('=== Testing Signup Error Handling (SaaS Approach) ===\n');
  
  const existingEmail = 'shalconnect00@gmail.com';
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    console.log(`📧 Attempting to sign up with existing email: ${existingEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: existingEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName
        },
        emailRedirectTo: 'https://balanze.cash/auth'
      }
    });
    
    console.log('\n📊 Results:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.log('\n🔍 Error Analysis:');
      console.log('Error message:', error.message);
      console.log('Error status:', error.status);
      console.log('Error name:', error.name);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      // Check our error patterns for SaaS-style handling
      const errorMessage = error.message.toLowerCase();
      console.log('\n🔍 SaaS Error Pattern Matching:');
      console.log('Contains "already registered":', errorMessage.includes('already registered'));
      console.log('Contains "already exists":', errorMessage.includes('already exists'));
      console.log('Contains "user already registered":', errorMessage.includes('user already registered'));
      console.log('Contains "email already exists":', errorMessage.includes('email already exists'));
      console.log('Contains "user already exists":', errorMessage.includes('user already exists'));
      console.log('Contains "already been registered":', errorMessage.includes('already been registered'));
      console.log('Contains "duplicate":', errorMessage.includes('duplicate'));
      console.log('Contains "unique":', errorMessage.includes('unique'));
      console.log('Contains "constraint":', errorMessage.includes('constraint'));
      
      // Determine if this is a duplicate email error
      const isDuplicateEmail = errorMessage.includes('already registered') ||
                              errorMessage.includes('already exists') ||
                              errorMessage.includes('user already registered') ||
                              errorMessage.includes('email already exists') ||
                              errorMessage.includes('user already exists') ||
                              errorMessage.includes('already been registered') ||
                              errorMessage.includes('duplicate') ||
                              errorMessage.includes('unique') ||
                              errorMessage.includes('constraint');
      
      console.log('\n🎯 SaaS Decision:');
      if (isDuplicateEmail) {
        console.log('✅ This is a duplicate email error - show user-friendly message');
        console.log('User message: "This email is already registered. Please use a different email or try logging in."');
      } else {
        console.log('❓ This is a different error - show generic error message');
        console.log('User message:', error.message);
      }
      
    } else {
      console.log('\n❌ No error returned - this means duplicate emails are still being allowed!');
      console.log('User created:', data.user?.id);
      console.log('Email confirmed:', data.user?.email_confirmed_at);
      console.log('\n🔧 This confirms the database trigger is not working properly.');
    }
    
  } catch (error) {
    console.log('❌ Exception:', error);
  }
}

testSignupErrorHandling(); 