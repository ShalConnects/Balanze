import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Email transporter - only create if SMTP is configured
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function gatherUserData(userId) {
  const data = {};

  // Gather accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);
  data.accounts = accounts || [];

  // Gather transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
  data.transactions = transactions || [];

  // Gather purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId);
  data.purchases = purchases || [];

  // Gather lend/borrow records
  const { data: lendBorrow } = await supabase
    .from('lend_borrow')
    .select('*')
    .eq('user_id', userId);
  data.lendBorrow = lendBorrow || [];

  // Gather donation/savings records
  const { data: donationSavings } = await supabase
    .from('donation_saving_records')
    .select('*')
    .eq('user_id', userId);
  data.donationSavings = donationSavings || [];

  return data;
}

function filterDataBySettings(userData, includeSettings) {
  const filtered = {};
  
  if (includeSettings.accounts) {
    filtered.accounts = userData.accounts;
  }
  if (includeSettings.transactions) {
    filtered.transactions = userData.transactions;
  }
  if (includeSettings.purchases) {
    filtered.purchases = userData.purchases;
  }
  if (includeSettings.lendBorrow) {
    filtered.lendBorrow = userData.lendBorrow;
  }
  if (includeSettings.savings) {
    filtered.donationSavings = userData.donationSavings;
  }

  return filtered;
}

function createEmailContent(user, recipient, data, settings, isTestMode = false) {
  const totalAccounts = data.accounts?.length || 0;
  const totalTransactions = data.transactions?.length || 0;
  const totalPurchases = data.purchases?.length || 0;
  const totalLendBorrow = data.lendBorrow?.length || 0;
  const totalSavings = data.donationSavings?.length || 0;

  // Get recipient name from the recipient object
  const recipientName = recipient.name || recipient.email || 'Recipient';
  
  // Get user's display name (from metadata or email)
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account holder';

  const testModeIndicator = isTestMode ? `
    <div style="background: #d1fae5; border: 2px solid #6ee7b7; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
      <h3 style="color: #047857; margin: 0 0 10px 0; font-size: 18px;">🧪 TEST MODE</h3>
      <p style="color: #065f46; margin: 0;">This is a test email from the Last Wish system. No real financial data is being delivered.</p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isTestMode ? 'Test Email - ' : ''}Last Wish Delivery - Important Financial Information</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }
        .email-wrapper {
          background: #f5f5f5;
          padding: 40px 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .email-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .email-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 600;
        }
        .email-header p {
          margin: 0;
          opacity: 0.95;
          font-size: 16px;
        }
        .email-body {
          padding: 30px;
        }
        .greeting {
          margin-bottom: 25px;
        }
        .greeting h2 {
          color: #1f2937;
          font-size: 20px;
          margin: 0 0 10px 0;
          font-weight: 600;
        }
        .greeting p {
          color: #6b7280;
          margin: 0;
          line-height: 1.7;
        }
        .context-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .context-box p {
          margin: 0;
          color: #92400e;
          line-height: 1.7;
        }
        .context-box strong {
          display: block;
          margin-bottom: 8px;
          color: #78350f;
          font-size: 15px;
        }
        .personal-message {
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .personal-message h3 {
          color: #1e40af;
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .personal-message p {
          color: #1e3a8a;
          margin: 0;
          line-height: 1.7;
          font-style: italic;
        }
        .data-summary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 25px;
          margin-bottom: 25px;
        }
        .data-summary h3 {
          color: #111827;
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 600;
        }
        .data-summary ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .data-summary li {
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          color: #4b5563;
        }
        .data-summary li:last-child {
          border-bottom: none;
        }
        .data-summary li strong {
          color: #111827;
        }
        .attachment-info {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
          text-align: center;
        }
        .attachment-info p {
          margin: 0 0 12px 0;
          color: #065f46;
          font-weight: 500;
        }
        .attachment-info .filename {
          font-family: 'Courier New', monospace;
          background: white;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
          font-size: 14px;
          color: #047857;
          margin: 4px;
        }
        .privacy-notice {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .privacy-notice h4 {
          color: #374151;
          margin: 0 0 10px 0;
          font-size: 15px;
          font-weight: 600;
        }
        .privacy-notice p {
          color: #6b7280;
          margin: 0;
          line-height: 1.7;
          font-size: 14px;
        }
        .email-footer {
          background: #f9fafb;
          padding: 25px 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .email-footer p {
          margin: 5px 0;
          color: #6b7280;
          font-size: 13px;
        }
        .email-footer .date {
          color: #9ca3af;
          font-size: 12px;
        }
        .test-indicator {
          background: #d1fae5;
          border: 2px solid #6ee7b7;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 30px;
          text-align: center;
        }
        .test-indicator h3 {
          color: #047857;
          margin: 0 0 8px 0;
          font-size: 18px;
        }
        .test-indicator p {
          color: #065f46;
          margin: 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          ${testModeIndicator}
          
          <!-- Email Header -->
          <div class="email-header">
            <h1>💚 Last Wish Delivery</h1>
            <p>Important Financial Information</p>
          </div>

          <!-- Email Body -->
          <div class="email-body">
            <!-- Greeting -->
            <div class="greeting">
              <h2>Dear ${recipientName},</h2>
              <p>
                You are receiving this email because someone who trusted you has chosen to share their important financial information with you.
              </p>
            </div>

            <!-- Context Box -->
            <div class="context-box">
              <strong>Why are you receiving this?</strong>
              <p>
                <strong>${userName}</strong> set up a Last Wish system to ensure their financial records would be safely delivered to trusted individuals if they were unable to check in for an extended period. This delivery has been automatically triggered as part of that plan.
              </p>
            </div>

            ${settings.message ? `
              <!-- Personal Message -->
              <div class="personal-message">
                <h3>💌 Personal Message from ${userName}</h3>
                <p>${settings.message}</p>
              </div>
            ` : ''}

            <!-- Data Summary -->
            <div class="data-summary">
              <h3>Financial Records Summary</h3>
              <ul>
                ${totalAccounts > 0 ? `<li><span>Bank Accounts</span> <strong>${totalAccounts}</strong></li>` : ''}
                ${totalTransactions > 0 ? `<li><span>Transactions</span> <strong>${totalTransactions}</strong></li>` : ''}
                ${totalPurchases > 0 ? `<li><span>Purchases</span> <strong>${totalPurchases}</strong></li>` : ''}
                ${totalLendBorrow > 0 ? `<li><span>Lend/Borrow Records</span> <strong>${totalLendBorrow}</strong></li>` : ''}
                ${totalSavings > 0 ? `<li><span>Savings Records</span> <strong>${totalSavings}</strong></li>` : ''}
              </ul>
            </div>

            <!-- Attachment Info -->
            <div class="attachment-info">
              <p>📎 Complete financial data is attached to this email</p>
              <div class="filename">financial-data-backup.json</div>
              <div class="filename">financial-data-backup.pdf</div>
            </div>

            <!-- Privacy Notice -->
            <div class="privacy-notice">
              <h4>🔒 Please Handle With Care</h4>
              <p>
                This information contains sensitive financial data. Please store it securely, respect the privacy of the account holder, and only use it as intended. If you have any concerns about receiving this information, please disregard this email.
              </p>
            </div>
          </div>

          <!-- Email Footer -->
          <div class="email-footer">
            <p><strong>Last Wish System - FinTrack</strong></p>
            <p>Automated delivery • Sent with care and respect</p>
            <p class="date">Delivery Date: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function createPDFBuffer(user, recipient, data, settings) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Get names
      const recipientName = recipient.name || recipient.email;
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account holder';

      // Header
      doc.fontSize(24).fillColor('#10b981').text('💚 Last Wish Delivery', { align: 'center' });
      doc.fontSize(14).fillColor('#6b7280').text('Financial Records Backup', { align: 'center' });
      doc.moveDown(2);

      // Recipient Info
      doc.fontSize(16).fillColor('#111827').text(`Dear ${recipientName},`);
      doc.moveDown();
      doc.fontSize(11).fillColor('#4b5563').text(
        `This document contains the financial records from ${userName}, delivered through the Last Wish system.`,
        { align: 'justify' }
      );
      doc.moveDown(2);

      // Personal Message (if exists)
      if (settings.message) {
        doc.fontSize(14).fillColor('#1e40af').text('Personal Message');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#4b5563').text(settings.message, {
          align: 'justify',
          italic: true
        });
        doc.moveDown(2);
      }

      // Data Summary
      doc.fontSize(14).fillColor('#111827').text('Financial Records Summary');
      doc.moveDown(0.5);
      
      const totalAccounts = data.accounts?.length || 0;
      const totalTransactions = data.transactions?.length || 0;
      const totalPurchases = data.purchases?.length || 0;
      const totalLendBorrow = data.lendBorrow?.length || 0;
      const totalSavings = data.donationSavings?.length || 0;

      if (totalAccounts > 0) {
        doc.fontSize(11).fillColor('#4b5563').text(`• Bank Accounts: ${totalAccounts}`);
      }
      if (totalTransactions > 0) {
        doc.text(`• Transactions: ${totalTransactions}`);
      }
      if (totalPurchases > 0) {
        doc.text(`• Purchases: ${totalPurchases}`);
      }
      if (totalLendBorrow > 0) {
        doc.text(`• Lend/Borrow Records: ${totalLendBorrow}`);
      }
      if (totalSavings > 0) {
        doc.text(`• Savings Records: ${totalSavings}`);
      }
      doc.moveDown(2);

      // Accounts Section
      if (data.accounts && data.accounts.length > 0) {
        doc.addPage();
        doc.fontSize(16).fillColor('#111827').text('Bank Accounts', { underline: true });
        doc.moveDown();
        
        data.accounts.forEach((account, index) => {
          doc.fontSize(12).fillColor('#10b981').text(`Account ${index + 1}`);
          doc.fontSize(10).fillColor('#4b5563');
          doc.text(`Name: ${account.name || 'N/A'}`);
          doc.text(`Type: ${account.type || 'N/A'}`);
          doc.text(`Balance: ${account.balance || 0}`);
          doc.text(`Currency: ${account.currency || 'USD'}`);
          doc.moveDown();
        });
      }

      // Transactions Section (show recent)
      if (data.transactions && data.transactions.length > 0) {
        doc.addPage();
        doc.fontSize(16).fillColor('#111827').text('Recent Transactions', { underline: true });
        doc.moveDown();
        
        const recentTransactions = data.transactions.slice(0, 20); // First 20
        recentTransactions.forEach((tx, index) => {
          doc.fontSize(10).fillColor('#4b5563');
          doc.text(`${new Date(tx.date).toLocaleDateString()}: ${tx.description || 'N/A'} - ${tx.amount || 0} ${tx.currency || 'USD'}`);
        });
        
        if (data.transactions.length > 20) {
          doc.moveDown();
          doc.fontSize(9).fillColor('#9ca3af').text(
            `... and ${data.transactions.length - 20} more transactions (see JSON file for complete data)`
          );
        }
      }

      // Purchases Section
      if (data.purchases && data.purchases.length > 0) {
        doc.addPage();
        doc.fontSize(16).fillColor('#111827').text('Purchases', { underline: true });
        doc.moveDown();
        
        data.purchases.forEach((purchase, index) => {
          doc.fontSize(11).fillColor('#6b21a8').text(`${purchase.name || 'Purchase ' + (index + 1)}`);
          doc.fontSize(10).fillColor('#4b5563');
          doc.text(`Amount: ${purchase.amount || 0}`);
          doc.text(`Status: ${purchase.status || 'N/A'}`);
          if (purchase.target_date) {
            doc.text(`Target Date: ${new Date(purchase.target_date).toLocaleDateString()}`);
          }
          doc.moveDown();
        });
      }

      // Footer on last page
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#9ca3af').text(
        'This document was automatically generated by the Last Wish System - FinTrack',
        { align: 'center' }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function sendDataToRecipient(user, recipient, userData, settings, isTestMode = false) {
  try {
    // Filter data based on user preferences
    const filteredData = filterDataBySettings(userData, settings.include_data);

    // Create email content
    const emailContent = createEmailContent(user, recipient, filteredData, settings, isTestMode);

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfBuffer = await createPDFBuffer(user, recipient, filteredData, settings);
    console.log('✅ PDF generated successfully');

    // Get user's display name for subject
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || user.email;

    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipient.email,
      subject: `${isTestMode ? '🧪 Test - ' : ''}Last Wish Delivery from ${userName}`,
      html: emailContent,
      attachments: [
        {
          filename: `${isTestMode ? 'test-' : ''}financial-data-backup.json`,
          content: JSON.stringify(filteredData, null, 2),
          contentType: 'application/json'
        },
        {
          filename: `${isTestMode ? 'test-' : ''}financial-data-backup.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log(`📧 Sending ${isTestMode ? 'test ' : ''}email to: ${recipient.email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipient.email}:`, result.messageId);

    // Log delivery
    await supabase
      .from('last_wish_deliveries')
      .insert({
        user_id: user.id,
        recipient_email: recipient.email,
        delivery_data: filteredData,
        delivery_status: 'sent',
        sent_at: new Date().toISOString()
      });

    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error(`❌ Error sending to ${recipient.email}:`, error);
    
    // Log failed delivery
    await supabase
      .from('last_wish_deliveries')
      .insert({
        user_id: user.id,
        recipient_email: recipient.email,
        delivery_data: {},
        delivery_status: 'failed',
        error_message: error.message,
        sent_at: new Date().toISOString()
      });

    return { success: false, error: error.message };
  }
}

async function sendLastWishEmail(userId, testMode = false) {
  try {
    console.log(`🚀 Starting Last Wish email delivery for user: ${userId} (test mode: ${testMode})`);

    // Check if SMTP is configured
    if (!transporter) {
      throw new Error('SMTP not configured. Please set up SMTP settings in environment variables.');
    }

    // Get user's Last Wish settings
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      throw new Error('Last Wish settings not found');
    }

    if (!settings.recipients || settings.recipients.length === 0) {
      throw new Error('No recipients configured');
    }

    // Get user profile
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error('User not found');
    }

    // Gather user data
    console.log('📊 Gathering user financial data...');
    const userData = await gatherUserData(userId);
    console.log(`📊 Data gathered: ${Object.keys(userData).map(key => `${key}: ${userData[key].length}`).join(', ')}`);

    // Send emails to all recipients
    const results = [];
    for (const recipient of settings.recipients) {
      console.log(`📧 Sending to recipient: ${recipient.email} (${recipient.name})`);
      const result = await sendDataToRecipient(user.user, recipient, userData, settings, testMode);
      results.push({
        recipient: recipient.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
    }

    // Mark as delivered (only if not in test mode)
    if (!testMode) {
      await supabase
        .from('last_wish_settings')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Last Wish delivery completed: ${successCount} successful, ${failCount} failed`);

    return {
      success: true,
      message: `Last Wish delivered to ${successCount} recipient(s)`,
      results: results,
      deliveredAt: new Date().toISOString(),
      successful: successCount,
      failed: failCount
    };

  } catch (error) {
    console.error(`❌ Last Wish delivery failed:`, error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Export the handler function
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, testMode = false } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required' 
      });
    }

    console.log(`📧 API: Starting Last Wish email delivery for user: ${userId} (test mode: ${testMode})`);
    
    const result = await sendLastWishEmail(userId, testMode);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error(`❌ API Error:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
