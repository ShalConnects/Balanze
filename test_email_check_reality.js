import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailCheckReality() {
  console.log('=== Testing Email Check Reality ===\n');
  
  const testEmails = [
    'shalconnect00@gmail.com', // This exists
    'definitely-does-not-exist-12345@example.com', // This doesn't exist
    'another-fake-email-67890@test.com' // This doesn't exist
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy-password-for-check-' + Date.now()
      });
      
      if (error) {
        console.log(`❌ Error for ${email}:`, error.message);
        console.log(`   Error type: ${error.message.toLowerCase().includes('invalid login credentials') ? 'Invalid credentials' : 'Other'}`);
      } else {
        console.log(`✅ Success for ${email} (this shouldn't happen with dummy password)`);
        await supabase.auth.signOut();
      }
      
    } catch (error) {
      console.log(`💥 Exception for ${email}:`, error.message);
    }
    
    console.log('---');
  }
  
  console.log('\n🔍 CONCLUSION:');
  console.log('Supabase returns the SAME "Invalid login credentials" error for ALL emails!');
  console.log('This is why our email existence check is NOT working.');
  console.log('We need a different approach.');
}

testEmailCheckReality(); 