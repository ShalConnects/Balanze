import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailCheck() {
  console.log('=== Testing Email Check Function ===\n');
  
  const testEmails = [
    'shalconnect00@gmail.com',  // Should exist
    'nonexistent@email.com',    // Should not exist
    'test@example.com'          // Should not exist
  ];
  
  for (const email of testEmails) {
    try {
      console.log(`📧 Checking email: ${email}`);
      
      const { data, error } = await supabase.rpc('check_email_exists', {
        email_to_check: email
      });
      
      if (error) {
        console.log(`❌ Error checking ${email}:`, error);
      } else {
        console.log(`✅ ${email} exists: ${data}`);
      }
      
    } catch (error) {
      console.log(`❌ Exception checking ${email}:`, error);
    }
    
    console.log('---');
  }
  
  console.log('\n=== Test Complete ===');
}

testEmailCheck(); 