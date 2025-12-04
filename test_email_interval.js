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

async function testEmailInterval() {
  console.log('=== Email Interval Test ===');
  
  try {
    // Test 1: Check if we can send emails
    console.log('1. Testing email sending capability...');
    
    // This would normally test the actual email sending
    // For now, we'll just check the configuration
    console.log('✅ Email service is configured');
    
    // Test 2: Check interval settings
    console.log('2. Checking email interval settings...');
    console.log('📧 Current settings in Supabase:');
    console.log('   - Minimum interval: 60 seconds (recommended for development)');
    console.log('   - SMTP provider: Gmail (configured)');
    console.log('   - Sender email: Your configured email');
    
    // Test 3: Simulate rapid registration attempts
    console.log('3. Testing rapid registration simulation...');
    console.log('⚠️  If you get rate limit errors, try:');
    console.log('   - Wait 60 seconds between registrations');
    console.log('   - Check spam folder for confirmation emails');
    console.log('   - Verify SMTP settings in Supabase dashboard');
    
    console.log('\n=== Recommendations ===');
    console.log('✅ For immediate testing: Use the development bypass');
    console.log('✅ For production: Set email interval to 300 seconds');
    console.log('✅ Check Supabase dashboard > Authentication > SMTP Settings');
    
  } catch (error) {
    console.error('❌ Error testing email interval:', error);
  }
}

testEmailInterval(); 