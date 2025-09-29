import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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

  const testModeIndicator = isTestMode ? `
    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #155724; margin: 0 0 10px 0;">🧪 TEST MODE</h3>
      <p style="color: #155724; margin: 0;">This is a test email from the Last Wish system. No real financial data is being delivered.</p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isTestMode ? 'Test Email - ' : ''}Last Wish - Digital Time Capsule</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .data-summary { background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        ${testModeIndicator}
        
        <div class="header">
          <h2>${isTestMode ? '🧪 Test Email - ' : ''}Last Wish - Digital Time Capsule</h2>
          <p>This email contains important financial data that was requested to be delivered to you.</p>
        </div>

        <div class="warning">
          <strong>⚠️ Important Notice:</strong>
          <p>This data has been automatically delivered because ${user.email} has not checked in with their financial management system for an extended period.</p>
        </div>

        ${settings.message ? `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3>Personal Message from ${user.email}:</h3>
            <div>${settings.message}</div>
          </div>
        ` : ''}

        <div class="data-summary">
          <h3>Financial Data Summary:</h3>
          <ul>
            ${totalAccounts > 0 ? `<li>Accounts: ${totalAccounts}</li>` : ''}
            ${totalTransactions > 0 ? `<li>Transactions: ${totalTransactions}</li>` : ''}
            ${totalPurchases > 0 ? `<li>Purchases: ${totalPurchases}</li>` : ''}
            ${totalLendBorrow > 0 ? `<li>Lend/Borrow Records: ${totalLendBorrow}</li>` : ''}
            ${totalSavings > 0 ? `<li>Savings Records: ${totalSavings}</li>` : ''}
          </ul>
        </div>

        <p>A detailed JSON file containing all the financial data has been attached to this email.</p>

        <div class="footer">
          <p>This is an automated delivery from the Last Wish system. Please handle this information with care and respect for ${user.email}'s privacy.</p>
          <p>Delivery Date: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendDataToRecipient(user, recipient, userData, settings, isTestMode = false) {
  try {
    // Filter data based on user preferences
    const filteredData = filterDataBySettings(userData, settings.include_data);

    // Create email content
    const emailContent = createEmailContent(user, recipient, filteredData, settings, isTestMode);

    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipient.email,
      subject: `${isTestMode ? '🧪 Test Email - ' : ''}Important: Financial Data from ${user.email} - Last Wish`,
      html: emailContent,
      attachments: [
        {
          filename: `${isTestMode ? 'test-' : ''}financial-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`,
          content: JSON.stringify(filteredData, null, 2),
          contentType: 'application/json'
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
