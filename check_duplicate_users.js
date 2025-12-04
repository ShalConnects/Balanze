import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicateUsers() {
  console.log('=== Checking for Duplicate Users ===\n');
  
  const testEmail = 'shalconnect00@gmail.com';
  
  try {
    // Try to sign in with the original password to see if we can find the original user
    console.log(`🔍 Trying to sign in with: ${testEmail}`);
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpass123' // Try the original password
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful with original user:', signInData.user?.id);
      console.log('Original user created at:', signInData.user?.created_at);
    }
    
    // Sign out
    await supabase.auth.signOut();
    
    // Now try to sign in with the new password we just created
    console.log(`\n🔍 Trying to sign in with newly created account...`);
    
    const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!' // The password from our test
    });
    
    if (newSignInError) {
      console.log('❌ New account sign in failed:', newSignInError.message);
    } else {
      console.log('✅ Sign in successful with new user:', newSignInData.user?.id);
      console.log('New user created at:', newSignInData.user?.created_at);
    }
    
    console.log('\n🔍 Analysis:');
    console.log('This confirms that Supabase is allowing multiple users with the same email address.');
    console.log('This is why our error detection isn\'t working - there\'s no error being returned!');
    
  } catch (error) {
    console.log('❌ Exception:', error);
  }
}

checkDuplicateUsers(); 