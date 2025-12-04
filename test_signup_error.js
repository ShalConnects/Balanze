const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupError() {
  const testEmail = 'test@example.com'; // Use an email that exists in your database
  
  console.log('Testing signup with existing email:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        emailRedirectTo: 'http://localhost:5173/auth'
      }
    });
    
    if (error) {
      console.log('Error message:', error.message);
      console.log('Error status:', error.status);
      console.log('Full error:', error);
    } else {
      console.log('No error returned');
    }
  } catch (error) {
    console.log('Exception:', error);
  }
}

testSignupError(); 