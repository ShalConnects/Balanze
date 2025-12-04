const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExistingEmail() {
  const existingEmail = 'shalconnect00@gmail.com'; // Use an email that exists
  
  console.log('Testing signup with existing email:', existingEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: existingEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User'
        },
        emailRedirectTo: 'http://localhost:5173/auth'
      }
    });
    
    if (error) {
      console.log('Error message:', error.message);
      console.log('Error status:', error.status);
      console.log('Full error:', error);
    } else {
      console.log('No error returned');
      console.log('Data:', data);
    }
  } catch (error) {
    console.log('Exception:', error);
  }
}

testExistingEmail(); 