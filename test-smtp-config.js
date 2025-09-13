/**
 * SMTP Configuration Test Script
 * 
 * This script tests the SMTP configuration for Last Wish email delivery
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

console.log('🔧 SMTP Configuration Test');
console.log('=' .repeat(50));
console.log(`SMTP Host: ${SMTP_HOST}`);
console.log(`SMTP Port: ${SMTP_PORT}`);
console.log(`SMTP User: ${SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`SMTP Pass: ${SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ SMTP configuration incomplete!');
  console.log('');
  console.log('📋 To fix this:');
  console.log('1. Copy env.template to .env');
  console.log('2. Set your SMTP credentials:');
  console.log('   SMTP_HOST=smtp.gmail.com');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your-email@gmail.com');
  console.log('   SMTP_PASS=your-app-password');
  console.log('');
  console.log('📧 For Gmail:');
  console.log('1. Enable 2-Factor Authentication');
  console.log('2. Generate App Password: https://myaccount.google.com/security');
  console.log('3. Use the 16-character app password');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function testSMTPConnection() {
  try {
    console.log('🔌 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return false;
  }
}

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email...');
    
    const testEmail = {
      from: SMTP_USER,
      to: SMTP_USER, // Send to yourself for testing
      subject: 'Last Wish SMTP Test - ' + new Date().toLocaleString(),
      html: `
        <h2>Last Wish SMTP Test</h2>
        <p>This is a test email to verify SMTP configuration for the Last Wish system.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>SMTP Host:</strong> ${SMTP_HOST}</p>
        <p><strong>SMTP Port:</strong> ${SMTP_PORT}</p>
        <hr>
        <p><em>If you receive this email, your SMTP configuration is working correctly!</em></p>
      `,
      text: `
        Last Wish SMTP Test
        
        This is a test email to verify SMTP configuration for the Last Wish system.
        
        Timestamp: ${new Date().toISOString()}
        SMTP Host: ${SMTP_HOST}
        SMTP Port: ${SMTP_PORT}
        
        If you receive this email, your SMTP configuration is working correctly!
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📧 Sent to: ${testEmail.to}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting SMTP configuration test...\n');
  
  // Test connection
  const connectionOk = await testSMTPConnection();
  if (!connectionOk) {
    console.log('\n❌ SMTP test failed. Please check your configuration.');
    process.exit(1);
  }
  
  console.log('');
  
  // Send test email
  const emailOk = await sendTestEmail();
  if (!emailOk) {
    console.log('\n❌ Email sending failed. Please check your SMTP settings.');
    process.exit(1);
  }
  
  console.log('\n🎉 SMTP configuration test completed successfully!');
  console.log('✅ Your Last Wish email delivery system is ready to use.');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Enable test mode in Last Wish settings');
  console.log('2. Set 5-minute countdown');
  console.log('3. Add recipients');
  console.log('4. Wait for countdown to reach 00:00:00');
  console.log('5. Watch the automatic email delivery!');
}

// Run the test
runTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
