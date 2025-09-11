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

async function testEmailDetailed() {
  console.log('=== Detailed Email Test ===');
  
  try {
    // Test 1: Check environment
    console.log('1. Checking environment...');
    console.log(`✅ Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`);
    console.log(`✅ Supabase Key: ${supabaseServiceKey ? 'Configured' : 'Missing'}`);
    
    // Test 2: Try to sign up a test user
    console.log('\n2. Testing registration process...');
    const testEmail = `test-${Date.now()}@example.com`;
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
        console.log('⚠️  This is an SMTP configuration issue.');
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
      }
    }
    
    // Test 3: Check SMTP settings recommendations
    console.log('\n3. SMTP Configuration Recommendations:');
    console.log('   - Go to Supabase Dashboard → Authentication → Email → SMTP Settings');
    console.log('   - Verify SMTP Host: smtp.gmail.com');
    console.log('   - Verify Port: 465 (SSL) or 587 (TLS)');
    console.log('   - Verify Username: your full Gmail address');
    console.log('   - Verify Password: your Gmail app password');
    console.log('   - Verify Sender Email: matches your Gmail address');
    console.log('   - Set Minimum Interval: 60 seconds for development');
    console.log('   - Click "Test SMTP" in Supabase dashboard');
    
    // Test 4: Alternative solutions
    console.log('\n4. Alternative Solutions:');
    console.log('   - Wait 60-90 minutes if you hit rate limits');
    console.log('   - Use a different Gmail account for SMTP');
    console.log('   - Check Gmail security settings');
    console.log('   - Verify 2FA is enabled and app password is active');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailDetailed(); 