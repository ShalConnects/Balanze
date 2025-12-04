// Test real email sending functionality
// This will actually send emails to recipients

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// SMTP Configuration (you'll need to set these in your environment)
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

async function sendTestEmail() {
  console.log('📧 Testing Real Email Sending...\n');

  try {
    // Step 1: Get user's Last Wish settings
    const userId = 'cb3ac634-432d-4602-b2f9-3249702020d9'; // Replace with actual user ID
    
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) {
      console.error('❌ Error loading settings:', settingsError);
      return { success: false, error: 'Settings not found' };
    }

    if (!settings) {
      console.log('❌ No Last Wish settings found for user');
      return { success: false, error: 'No Last Wish settings configured' };
    }

    console.log('✅ Last Wish settings found');
    console.log(`   - Recipients: ${settings.recipients.length}`);
    console.log(`   - Message: ${settings.message ? 'Yes' : 'No'}`);

    // Step 2: Check SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('❌ SMTP configuration missing');
      console.log('   Please set SMTP_USER and SMTP_PASS environment variables');
      return { success: false, error: 'SMTP configuration missing' };
    }

    console.log('✅ SMTP configuration found');
    console.log(`   - Host: ${smtpConfig.host}`);
    console.log(`   - Port: ${smtpConfig.port}`);
    console.log(`   - User: ${smtpConfig.auth.user}`);

    // Step 3: Create email transporter
    const transporter = nodemailer.createTransporter(smtpConfig);

    // Step 4: Verify SMTP connection
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Step 5: Send test emails to all recipients
    console.log('📧 Sending test emails...');
    
    const emailPromises = settings.recipients.map(async (recipient, index) => {
      const mailOptions = {
        from: `"FinTrack Last Wish" <${smtpConfig.auth.user}>`,
        to: recipient.email,
        subject: '🧪 Test Email - Last Wish System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🧪 Last Wish System - Test Email</h2>
            
            <p>Hello ${recipient.name},</p>
            
            <p>This is a <strong>test email</strong> from the FinTrack Last Wish system to verify that email delivery is working correctly.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Test Details:</h3>
              <ul>
                <li><strong>Recipient:</strong> ${recipient.name} (${recipient.email})</li>
                <li><strong>Relationship:</strong> ${recipient.relationship}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>System Status:</strong> ✅ Working</li>
              </ul>
            </div>
            
            <p>If you received this email, the Last Wish system is working correctly and will be able to send your financial data when the time comes.</p>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Note:</strong> This is a test email. No actual financial data has been shared.</p>
            </div>
            
            <p>Best regards,<br>FinTrack Last Wish System</p>
          </div>
        `
      };

      try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${recipient.name} (${recipient.email})`);
        return { success: true, recipient: recipient.name, messageId: result.messageId };
      } catch (error) {
        console.error(`❌ Failed to send email to ${recipient.name}:`, error.message);
        return { success: false, recipient: recipient.name, error: error.message };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    // Count successful sends
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Email Results:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    if (successful > 0) {
      console.log('\n🎉 Test emails sent successfully!');
      console.log('   Check your email inbox (and spam folder) for the test emails.');
    }
    
    return { 
      success: successful > 0, 
      successful, 
      failed, 
      results 
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Export for use
export { sendTestEmail };
