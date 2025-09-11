import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupWithExistingEmail() {
  console.log('=== Testing Signup with Existing Email ===\n');
  
  const existingEmail = 'shalconnect00@gmail.com'; // Use an email that exists
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
      
      // Check our error patterns
      const errorMessage = error.message.toLowerCase();
      console.log('\n🔍 Pattern Matching:');
      console.log('Contains "already registered":', errorMessage.includes('already registered'));
      console.log('Contains "already exists":', errorMessage.includes('already exists'));
      console.log('Contains "user already registered":', errorMessage.includes('user already registered'));
      console.log('Contains "email already exists":', errorMessage.includes('email already exists'));
      console.log('Contains "user already exists":', errorMessage.includes('user already exists'));
      console.log('Contains "already been registered":', errorMessage.includes('already been registered'));
    } else {
      console.log('\n❌ No error returned - this is unexpected!');
      console.log('User created:', data.user?.id);
      console.log('Email confirmed:', data.user?.email_confirmed_at);
    }
    
  } catch (error) {
    console.log('❌ Exception:', error);
  }
}

testSignupWithExistingEmail(); 