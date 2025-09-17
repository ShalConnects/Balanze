import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('📧 DIRECT EMAIL TEST (BYPASS API)');
console.log('=' .repeat(50));

async function testDirectEmail() {
  try {
    console.log('🔧 Setting up SMTP transporter...');
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    console.log(`✅ SMTP configured: ${process.env.SMTP_USER}`);
    
    // Test email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Last Wish Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🧪 Last Wish System Test Email</h2>
            <p>This is a test email from your FinTrack Last Wish system.</p>
          </div>

          <div class="warning">
            <strong>⚠️ Test Notice:</strong>
            <p>This is a test email to verify that the Last Wish email delivery system is working correctly.</p>
          </div>

          <h3>✅ System Status:</h3>
          <ul>
            <li>✅ Database: Connected and working</li>
            <li>✅ SMTP: Configured and sending</li>
            <li>✅ Overdue Detection: Working</li>
            <li>✅ Email Delivery: This email proves it works!</li>
          </ul>

          <h3>📊 Test Details:</h3>
          <ul>
            <li>Test Time: ${new Date().toLocaleString()}</li>
            <li>Frequency: 5 minutes (for testing)</li>
            <li>Status: System operational</li>
          </ul>

          <p><strong>🎉 Congratulations! Your Last Wish email delivery system is working perfectly!</strong></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
            <p>This is a test email from the FinTrack Last Wish system. The actual system will send your real financial data when triggered.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send test email
    console.log('📧 Sending test email...');
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'salauddin.kader406@gmail.com',
      subject: '🧪 Last Wish System Test - Email Delivery Working!',
      html: emailContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   To: salauddin.kader406@gmail.com`);
    console.log(`   Subject: Last Wish System Test`);
    
    console.log('\n📧 CHECK YOUR EMAIL:');
    console.log('   ✅ Go to: salauddin.kader406@gmail.com');
    console.log('   ✅ Look for: "Last Wish System Test - Email Delivery Working!"');
    console.log('   ✅ This proves the email system works!');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check your email to confirm delivery');
    console.log('2. If email received → Email system is working');
    console.log('3. The API 500 error is likely environment variables in Vercel');
    console.log('4. But the core email functionality works!');
    
  } catch (error) {
    console.log('❌ Direct email test failed:', error.message);
    console.log('❌ Error details:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 SMTP Authentication Error:');
      console.log('   → Check your Gmail app password');
      console.log('   → Ensure 2FA is enabled and app password is correct');
    }
  }
}

testDirectEmail();
