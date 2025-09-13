import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

function createEmailContent(user, recipient, data, settings) {
  const totalAccounts = data.accounts?.length || 0;
  const totalTransactions = data.transactions?.length || 0;
  const totalPurchases = data.purchases?.length || 0;
  const totalLendBorrow = data.lendBorrow?.length || 0;
  const totalSavings = data.donationSavings?.length || 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Last Wish - Digital Time Capsule</title>
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
        <div class="header">
          <h2>Last Wish - Digital Time Capsule</h2>
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

async function sendDataToRecipient(user, recipient, userData, settings) {
  try {
    // Filter data based on user preferences
    const filteredData = filterDataBySettings(userData, settings.include_data);

    // Create email content
    const emailContent = createEmailContent(user, recipient, filteredData, settings);

    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipient.email,
      subject: `Important: Financial Data from ${user.email} - Last Wish`,
      html: emailContent,
      attachments: [
        {
          filename: `financial-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`,
          content: JSON.stringify(filteredData, null, 2),
          contentType: 'application/json'
        }
      ]
    };

    console.log(`📧 Sending email to: ${recipient.email}`);
    console.log(`📧 From: ${process.env.SMTP_USER}`);
    console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
    
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

// Export the handler function
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🚀 Starting Last Wish email delivery for user: ${userId}`);

    // Get user's Last Wish settings
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      return res.status(404).json({ error: 'Last Wish settings not found' });
    }

    if (!settings.recipients || settings.recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients configured' });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Gather user data
    console.log('📊 Gathering user financial data...');
    const userData = await gatherUserData(userId);
    console.log(`📊 Data gathered: ${Object.keys(userData).map(key => `${key}: ${userData[key].length}`).join(', ')}`);

    // Send emails to all recipients
    const results = [];
    for (const recipient of settings.recipients) {
      console.log(`📧 Sending to recipient: ${recipient.email} (${recipient.name})`);
      const result = await sendDataToRecipient(user.user, recipient, userData, settings);
      results.push({
        recipient: recipient.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
    }

    // Mark as delivered
    await supabase
      .from('last_wish_settings')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Last Wish delivery completed: ${successCount} successful, ${failCount} failed`);

    res.status(200).json({ 
      success: true,
      message: `Last Wish delivered to ${successCount} recipient(s)`,
      results: results,
      deliveredAt: new Date().toISOString(),
      successCount,
      failCount
    });

  } catch (error) {
    console.error(`❌ Last Wish delivery failed:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
