// Debug email API issues
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

console.log('🔍 Debugging Email API Issues...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`SMTP_HOST: ${process.env.SMTP_HOST ? '✅ Set' : '❌ Missing'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT ? '✅ Set' : '❌ Missing'}`);
console.log(`SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);

// Test Supabase connection
try {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  console.log('\n✅ Supabase client created successfully');
} catch (error) {
  console.error('\n❌ Supabase client creation failed:', error.message);
}

// Test SMTP configuration
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    console.log('\n✅ SMTP transporter created successfully');
    
    // Test SMTP connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('\n❌ SMTP connection failed:', error.message);
      } else {
        console.log('\n✅ SMTP connection verified successfully');
      }
    });
    
  } catch (error) {
    console.error('\n❌ SMTP transporter creation failed:', error.message);
  }
} else {
  console.log('\n❌ SMTP credentials missing');
}

// Test database query
async function testDatabaseQuery() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    console.log('\n🗄️ Testing database query...');
    
    const { data, error } = await supabase
      .from('last_wish_settings')
      .select('user_id')
      .eq('user_id', 'cb3ac634-432d-4602-b2f9-3249702020d9')
      .limit(1);
    
    if (error) {
      console.error('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database query successful');
      console.log(`   Found ${data ? data.length : 0} records`);
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabaseQuery();
