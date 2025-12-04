import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmailExistsAlternative(email) {
  try {
    console.log('Checking if email exists (alternative method):', email);
    
    // Try to sign in with a common test password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'testpass123' // Common test password
    });
    
    if (error) {
      const errorMessage = error.message.toLowerCase();
      
      // If we get "invalid login credentials", the email exists but password is wrong
      if (errorMessage.includes('invalid login credentials') ||
          errorMessage.includes('invalid email or password')) {
        console.log('✅ Email EXISTS (invalid password error)');
        return { exists: true, message: 'This email is already registered.' };
      }
      
      // For other errors, assume email doesn't exist
      console.log('✅ Email does NOT exist or other error:', error.message);
      return { exists: false };
    }
    
    // If sign in succeeds, the email exists
    console.log('✅ Email EXISTS (sign in successful)');
    await supabase.auth.signOut(); // Sign out immediately
    return { exists: true, message: 'This email is already registered.' };
    
  } catch (error) {
    console.error('❌ Email check exception:', error);
    return { exists: false };
  }
}

async function testAlternativeEmailCheck() {
  console.log('=== Testing Alternative Email Existence Check ===\n');
  
  const testEmails = [
    'nonexistent@example.com',
    'shalconnect00@gmail.com', // if this exists in your database
    'test@example.com' // if this exists in your database
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing: ${email}`);
    const result = await checkEmailExistsAlternative(email);
    console.log(`Result: ${result.exists ? 'EXISTS' : 'AVAILABLE'} - ${result.message || 'OK'}`);
    console.log('---');
  }
}

testAlternativeEmailCheck(); 