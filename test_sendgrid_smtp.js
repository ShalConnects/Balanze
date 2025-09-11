import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSendGridSMTP() {
  console.log('=== SendGrid SMTP Test ===');
  
  try {
    // Test 1: Check environment
    console.log('1. Checking environment...');
    console.log(`✅ Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`);
    console.log(`✅ Supabase Key: ${supabaseServiceKey ? 'Configured' : 'Missing'}`);
    
    // Test 2: Try to sign up a test user
    console.log('\n2. Testing registration with SendGrid SMTP...');
    const testEmail = `sendgrid-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Test email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'https://balanze.cash'
      }
    });
    
    if (error) {
      console.log('❌ Registration failed with error:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Status: ${error.status}`);
      
      if (error.message.includes('rate limit')) {
        console.log('⚠️  This is a rate limit error. Wait 60 seconds and try again.');
      } else if (error.message.includes('Error sending confirmation email')) {
        console.log('⚠️  SendGrid SMTP configuration issue.');
        console.log('   Please check your Supabase SMTP settings.');
      }
    } else {
      console.log('✅ Registration succeeded!');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      
      if (data.user?.email_confirmed_at) {
        console.log('✅ User can log in immediately');
      } else {
        console.log('⚠️  User needs email confirmation');
        console.log('📧 Check your email for confirmation link');
      }
    }
    
    // Test 3: SendGrid SMTP Configuration Checklist
    console.log('\n3. SendGrid SMTP Configuration Checklist:');
    console.log('   ✅ Sign up for SendGrid account');
    console.log('   ✅ Verify sender email in SendGrid');
    console.log('   ✅ Create API key with "Mail Send" permissions');
    console.log('   ✅ Configure Supabase SMTP settings:');
    console.log('      - Host: smtp.sendgrid.net');
    console.log('      - Port: 587');
    console.log('      - Username: apikey');
    console.log('      - Password: [Your SendGrid API Key]');
    console.log('      - Sender Email: [Your verified sender email]');
    console.log('      - Sender Name: [Your preferred name]');
    console.log('      - Minimum Interval: 60');
    
    // Test 4: Alternative Gmail setup
    console.log('\n4. Alternative Gmail Setup:');
    console.log('   ✅ Enable 2-Step Verification');
    console.log('   ✅ Generate App Password');
    console.log('   ✅ Use app password in Supabase SMTP settings');
    console.log('   ✅ Check Gmail sending limits (500/day)');
    
    // Test 5: Next steps
    console.log('\n5. Next Steps:');
    console.log('   - Follow the SendGrid setup guide');
    console.log('   - Test registration on your app');
    console.log('   - Check email for confirmation');
    console.log('   - Contact support if issues persist');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSendGridSMTP(); 