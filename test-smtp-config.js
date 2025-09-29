/**
 * Test SMTP Configuration
 * 
 * This script tests your SMTP configuration to ensure email delivery works.
 * Run with: node test-smtp-config.js
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔧 Testing SMTP Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   - SMTP_HOST: ${process.env.SMTP_HOST || '❌ Missing'}`);
console.log(`   - SMTP_PORT: ${process.env.SMTP_PORT || '❌ Missing'}`);
console.log(`   - SMTP_USER: ${process.env.SMTP_USER || '❌ Missing'}`);
console.log(`   - SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('\n❌ SMTP configuration is incomplete!');
  console.log('   Please set the following in your .env.local file:');
  console.log('   SMTP_HOST=smtp.gmail.com');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your-email@gmail.com');
  console.log('   SMTP_PASS=your-app-password');
  process.exit(1);
}

// Create transporter
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('\n✅ SMTP transporter created successfully');
} catch (error) {
  console.error('\n❌ SMTP transporter creation failed:', error.message);
  process.exit(1);
}

// Test SMTP connection
async function testSMTPConnection() {
  try {
    console.log('\n🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return false;
  }
}

// Send test email
async function sendTestEmail() {
  try {
    console.log('\n📧 Sending test email...');
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: '🧪 Test Email - Last Wish System',
      html: `
        <h2>🧪 Test Email - Last Wish System</h2>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</p>
        <p>If you received this email, your SMTP configuration is working! ✅</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Sent to: ${mailOptions.to}`);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    return false;
  }
}

// Run tests
async function runTest() {
  console.log('\n🚀 Starting SMTP tests...\n');
  
  // Test 1: SMTP Connection
  const connectionOk = await testSMTPConnection();
  if (!connectionOk) {
    console.log('\n❌ SMTP connection failed. Please check your credentials.');
    process.exit(1);
  }
  
  // Test 2: Send Test Email
  const emailOk = await sendTestEmail();
  if (!emailOk) {
    console.log('\n❌ Test email failed. Please check your SMTP settings.');
    process.exit(1);
  }
  
  console.log('\n🎉 All SMTP tests passed!');
  console.log('   Your email configuration is working correctly.');
  console.log('   You can now use the "Test Email Delivery" button in your app.');
}

// Run the test
runTest().catch(error => {
  console.error('\n💥 Test failed with error:', error.message);
  process.exit(1);
});