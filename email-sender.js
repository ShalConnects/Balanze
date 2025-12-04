/**
 * Direct Email Sender for Last Wish
 * 
 * This script can be run directly to send Last Wish emails
 * Usage: node email-sender.js
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

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendLastWishEmailDirect(userId) {
  try {
    console.log(`🚀 Sending Last Wish email for user: ${userId}`);

    // Get user's Last Wish settings
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId);

    if (settingsError || !settings || settings.length === 0) {
      throw new Error('Last Wish settings not found');
    }

    const settingsData = settings[0]; // Get the first (and should be only) settings record

    if (!settingsData.recipients || settingsData.recipients.length === 0) {
      throw new Error('No recipients configured');
    }

    // Check if already delivered
    const { data: existingDelivery } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', userId)
      .eq('delivery_status', 'sent')
      .limit(1);

    if (existingDelivery && existingDelivery.length > 0) {
      console.log('⚠️ Last Wish already delivered, skipping');
      return { success: true, message: 'Already delivered' };
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
    for (const recipient of settingsData.recipients) {
      console.log(`📧 Sending to recipient: ${recipient.email} (${recipient.name})`);
      const result = await sendDataToRecipient(user.user, recipient, userData, settingsData);
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

    return {
      success: true,
      message: `Last Wish delivered to ${successCount} recipient(s)`,
      results: results,
      deliveredAt: new Date().toISOString(),
      successCount,
      failCount
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

function generateDataPreview(data) {
  let preview = '';
  
  // Accounts Summary
  if (data.accounts && data.accounts.length > 0) {
    const totalBalance = data.accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    preview += `
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 14px;">💳 Account Balances</h4>
        <table class="preview-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Type</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.accounts.slice(0, 5).map(account => `
              <tr>
                <td>${account.title || 'Unnamed Account'}</td>
                <td>${account.type || 'Unknown'}</td>
                <td class="${(account.balance || 0) >= 0 ? 'amount-positive' : 'amount-negative'}">
                  $${(account.balance || 0).toLocaleString()}
                </td>
              </tr>
            `).join('')}
            ${data.accounts.length > 5 ? `<tr><td colspan="3" style="text-align: center; font-style: italic;">... and ${data.accounts.length - 5} more accounts</td></tr>` : ''}
          </tbody>
        </table>
        <div style="margin-top: 8px; font-weight: 600; color: #0c4a6e;">
          Total Balance: <span class="${totalBalance >= 0 ? 'amount-positive' : 'amount-negative'}">$${totalBalance.toLocaleString()}</span>
        </div>
      </div>
    `;
  }
  
  // Recent Transactions
  if (data.transactions && data.transactions.length > 0) {
    const recentTransactions = data.transactions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    preview += `
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 14px;">💸 Recent Transactions</h4>
        <table class="preview-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${recentTransactions.map(transaction => `
              <tr>
                <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
                <td>${transaction.description || 'No description'}</td>
                <td class="${(transaction.amount || 0) >= 0 ? 'amount-positive' : 'amount-negative'}">
                  $${(transaction.amount || 0).toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Savings Goals
  if (data.donationSavings && data.donationSavings.length > 0) {
    const totalSaved = data.donationSavings.reduce((sum, saving) => sum + (saving.amount || 0), 0);
    preview += `
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 14px;">💰 Savings Goals</h4>
        <div style="background: rgba(255, 255, 255, 0.7); padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Total Saved:</span>
            <span class="amount-positive" style="font-size: 16px; font-weight: 700;">$${totalSaved.toLocaleString()}</span>
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
            ${data.donationSavings.length} savings record${data.donationSavings.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  return preview || '<p style="color: #64748b; font-style: italic;">No financial data available for preview.</p>';
}

function generateHTMLReport(user, data, settings) {
  const userName = user.user_metadata?.full_name || 'User';
  const userEmail = user.email;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Report - ${userName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 20px; background: #f9fafb; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .positive { color: #059669; font-weight: 600; }
        .negative { color: #dc2626; font-weight: 600; }
        .summary-card { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Financial Report</h1>
            <p>${userName} (${userEmail})</p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
            ${settings.message ? `
                <div class="section">
                    <h2>💌 Personal Message</h2>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                        ${settings.message}
                    </div>
                </div>
            ` : ''}
            
            ${data.accounts && data.accounts.length > 0 ? `
                <div class="section">
                    <h2>💳 Accounts</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Account Name</th>
                                <th>Type</th>
                                <th>Balance</th>
                                <th>Currency</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.accounts.map(account => `
                                <tr>
                                    <td>${account.title || 'Unnamed Account'}</td>
                                    <td>${account.type || 'Unknown'}</td>
                                    <td class="${(account.balance || 0) >= 0 ? 'positive' : 'negative'}">
                                        $${(account.balance || 0).toLocaleString()}
                                    </td>
                                    <td>${account.currency || 'USD'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="summary-card">
                        <strong>Total Balance: $${data.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString()}</strong>
                    </div>
                </div>
            ` : ''}
            
            ${data.transactions && data.transactions.length > 0 ? `
                <div class="section">
                    <h2>💸 Recent Transactions</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.transactions.slice(0, 20).map(transaction => `
                                <tr>
                                    <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
                                    <td>${transaction.description || 'No description'}</td>
                                    <td class="${(transaction.amount || 0) >= 0 ? 'positive' : 'negative'}">
                                        $${(transaction.amount || 0).toLocaleString()}
                                    </td>
                                    <td>${transaction.category || 'Uncategorized'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${data.transactions.length > 20 ? `<p><em>Showing first 20 of ${data.transactions.length} transactions</em></p>` : ''}
                </div>
            ` : ''}
            
            ${data.donationSavings && data.donationSavings.length > 0 ? `
                <div class="section">
                    <h2>💰 Savings Goals</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Goal Name</th>
                                <th>Target Amount</th>
                                <th>Current Amount</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.donationSavings.map(saving => {
                                const progress = saving.target_amount ? (saving.amount / saving.target_amount * 100).toFixed(1) : 'N/A';
                                return `
                                    <tr>
                                        <td>${saving.title || 'Unnamed Goal'}</td>
                                        <td>$${(saving.target_amount || 0).toLocaleString()}</td>
                                        <td class="positive">$${(saving.amount || 0).toLocaleString()}</td>
                                        <td>${progress}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
}

function generateAccountsCSV(accounts) {
  const headers = ['Account Name', 'Type', 'Balance', 'Currency', 'Created Date'];
  const rows = accounts.map(account => [
    account.title || 'Unnamed Account',
    account.type || 'Unknown',
    account.balance || 0,
    account.currency || 'USD',
    new Date(account.created_at).toLocaleDateString()
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateTransactionsCSV(transactions) {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Account', 'Type'];
  const rows = transactions.map(transaction => [
    new Date(transaction.created_at).toLocaleDateString(),
    transaction.description || 'No description',
    transaction.amount || 0,
    transaction.category || 'Uncategorized',
    transaction.account_name || 'Unknown Account',
    transaction.type || 'Unknown'
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function createEmailContent(user, recipient, data, settings) {
  const totalAccounts = data.accounts?.length || 0;
  const totalTransactions = data.transactions?.length || 0;
  const totalPurchases = data.purchases?.length || 0;
  const totalLendBorrow = data.lendBorrow?.length || 0;
  const totalSavings = data.donationSavings?.length || 0;
  
  const fullName = user.user_metadata?.full_name || 'User';
  const userName = fullName.split(' ')[0]; // Extract first name only
  const userEmail = user.email;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Last Wish - Digital Time Capsule</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #374151;
                margin: 0;
                padding: 0;
                background-color: #f9fafb;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);
                padding: 40px 30px;
                text-align: center;
            }
            .logo {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }
            .logo-icon {
                width: 48px;
                height: 48px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 24px;
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                text-align: center;
                line-height: 1;
            }
            .logo-text {
                font-size: 28px;
                font-weight: bold;
                color: white;
            }
            .content {
                padding: 40px 30px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                color: #111827;
                margin-bottom: 16px;
                text-align: center;
            }
            .subtitle {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 32px;
                text-align: center;
            }
            .warning {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .warning-title {
                font-weight: 600;
                color: #92400e;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .warning-text {
                color: #92400e;
                font-size: 14px;
            }
            .personal-message {
                background-color: #f3f4f6;
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .personal-message-title {
                font-weight: 600;
                color: #111827;
                margin-bottom: 12px;
                font-size: 16px;
            }
            .data-summary {
                background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .data-summary-title {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 12px;
                font-size: 16px;
            }
            .data-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .data-list li {
                background: rgba(255, 255, 255, 0.7);
                padding: 8px 12px;
                margin: 4px 0;
                border-radius: 6px;
                color: #1e40af;
                font-weight: 500;
            }
            .attachment-info {
                background-color: #f0fdf4;
                border-left: 4px solid #10b981;
                padding: 16px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .attachment-title {
                font-weight: 600;
                color: #065f46;
                margin-bottom: 8px;
                font-size: 14px;
            }
            .attachment-text {
                color: #065f46;
                font-size: 14px;
            }
            .data-preview {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-left: 4px solid #0ea5e9;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .data-preview-title {
                font-weight: 600;
                color: #0c4a6e;
                margin-bottom: 12px;
                font-size: 16px;
            }
            .data-preview-content {
                color: #0c4a6e;
                font-size: 14px;
            }
            .preview-table {
                width: 100%;
                border-collapse: collapse;
                margin: 12px 0;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 8px;
                overflow: hidden;
            }
            .preview-table th {
                background: rgba(14, 165, 233, 0.1);
                padding: 8px 12px;
                text-align: left;
                font-weight: 600;
                color: #0c4a6e;
                border-bottom: 1px solid rgba(14, 165, 233, 0.2);
            }
            .preview-table td {
                padding: 8px 12px;
                border-bottom: 1px solid rgba(14, 165, 233, 0.1);
                color: #0c4a6e;
            }
            .preview-table tr:last-child td {
                border-bottom: none;
            }
            .amount-positive {
                color: #059669;
                font-weight: 600;
            }
            .amount-negative {
                color: #dc2626;
                font-weight: 600;
            }
            .explanation-section {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-left: 4px solid #0ea5e9;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .explanation-title {
                font-weight: 600;
                color: #0c4a6e;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .explanation-text {
                color: #0c4a6e;
                font-size: 14px;
            }
            .system-context {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 4px solid #22c55e;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .system-context-title {
                font-weight: 600;
                color: #166534;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .system-context-text {
                color: #166534;
                font-size: 14px;
            }
            .action-items {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .action-items-title {
                font-weight: 600;
                color: #92400e;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .action-items-text {
                color: #92400e;
                font-size: 14px;
            }
            .data-explanation {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                border-left: 4px solid #8b5cf6;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .data-explanation-title {
                font-weight: 600;
                color: #6b21a8;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .data-explanation-text {
                color: #6b21a8;
                font-size: 14px;
            }
            .privacy-security {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border-left: 4px solid #ef4444;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
            .privacy-security-title {
                font-weight: 600;
                color: #991b1b;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .privacy-security-text {
                color: #991b1b;
                font-size: 14px;
            }
            .footer {
                background-color: #f9fafb;
                padding: 24px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer-text {
                color: #9ca3af;
                font-size: 14px;
                margin-bottom: 8px;
            }
            .footer-link {
                color: #2563eb;
                text-decoration: none;
            }
            .footer-link:hover {
                text-decoration: underline;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                .header, .content, .footer {
                    padding: 24px 20px;
                }
                .title {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <div class="logo-icon">B</div>
                    <div class="logo-text">Balanze</div>
                </div>
            </div>
            
            <div class="content">
                <h1 class="title">Digital Time Capsule Opened</h1>
                <p class="subtitle">${userName}'s financial information has been automatically delivered to you.</p>
                
                <div class="explanation-section">
                    <div class="explanation-title">🔍 What is this email?</div>
                    <div class="explanation-text">
                        This is an automated delivery from Balanze's "Last Wish" system. ${userName} set up this service to automatically share their financial information with trusted contacts if they don't check in for an extended period. This email was triggered because ${userName} hasn't checked in for an extended period.
                    </div>
                </div>

                <div class="system-context">
                    <div class="system-context-title">⚙️ How does Last Wish work?</div>
                    <div class="system-context-text">
                        <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
                            <li>Users set up trusted recipients (like you)</li>
                            <li>They choose how often to "check in" (daily, weekly, etc.)</li>
                            <li>If they miss their check-in deadline, this email is automatically sent</li>
                            <li>It's like a digital safety net for important financial information</li>
                        </ul>
                    </div>
                </div>

                <div class="action-items">
                    <div class="action-items-title">📋 What should you do?</div>
                    <div class="action-items-text">
                        <ol style="margin: 8px 0; padding-left: 20px; color: #374151;">
                            <li><strong>Review the financial data</strong> in the attachments below</li>
                            <li><strong>Contact ${userName}</strong> to confirm they're okay</li>
                            <li><strong>If you can't reach them</strong>, consider checking on them in person</li>
                            <li><strong>Keep this information secure</strong> and confidential</li>
                        </ol>
                    </div>
                </div>

                <div class="warning">
                    <div class="warning-title">⚠️ Important Notice</div>
                    <div class="warning-text">
                        This data has been automatically delivered because ${userName} (${userEmail}) has not checked in with their Balanze financial management system for an extended period.
                    </div>
                </div>

                ${settings.message ? `
                    <div class="personal-message">
                        <div class="personal-message-title">💌 Personal Message from ${userName}:</div>
                        <div style="color: #374151; font-size: 14px;">${settings.message}</div>
                    </div>
                ` : ''}

                <div class="data-summary">
                    <div class="data-summary-title">📊 Financial Data Summary</div>
                    <ul class="data-list">
                        ${totalAccounts > 0 ? `<li>💳 Accounts: ${totalAccounts}</li>` : ''}
                        ${totalTransactions > 0 ? `<li>💸 Transactions: ${totalTransactions}</li>` : ''}
                        ${totalPurchases > 0 ? `<li>🛒 Purchases: ${totalPurchases}</li>` : ''}
                        ${totalLendBorrow > 0 ? `<li>🤝 Lend/Borrow Records: ${totalLendBorrow}</li>` : ''}
                        ${totalSavings > 0 ? `<li>💰 Savings Records: ${totalSavings}</li>` : ''}
                    </ul>
                </div>

                <div class="data-explanation">
                    <div class="data-explanation-title">📊 Understanding the Financial Data</div>
                    <div class="data-explanation-text">
                        <p style="margin: 8px 0; color: #374151;">The financial data includes:</p>
                        <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
                            <li><strong>💳 Accounts:</strong> Bank accounts, credit cards, investments, and other financial accounts</li>
                            <li><strong>💸 Transactions:</strong> Recent spending, income, and money movements</li>
                            <li><strong>💰 Savings:</strong> Savings goals, progress, and financial targets</li>
                            <li><strong>🤝 Lend/Borrow:</strong> Money lent to others or borrowed from others</li>
                            <li><strong>🛒 Purchases:</strong> Recent purchases and spending records</li>
                        </ul>
                        <p style="margin: 8px 0; color: #374151; font-style: italic;">This data helps you understand ${userName}'s complete financial situation and can be useful for managing their affairs if needed.</p>
                    </div>
                </div>

                <div class="attachment-info">
                    <div class="attachment-title">📎 Financial Data Attachments</div>
                    <div class="attachment-text">
                        Multiple formats have been attached for your convenience:
                        <ul style="margin: 8px 0; padding-left: 20px; color: #065f46;">
                            <li><strong>📊 Financial Summary (HTML)</strong> - Easy-to-read formatted report</li>
                            <li><strong>📋 Complete Data (JSON)</strong> - Full technical data for developers</li>
                            <li><strong>📈 Spreadsheet Data (CSV)</strong> - For Excel/Google Sheets users</li>
                        </ul>
                        Choose the format that works best for you!
                    </div>
                </div>

                <div class="data-preview">
                    <div class="data-preview-title">📊 Quick Financial Overview</div>
                    <div class="data-preview-content">
                        ${generateDataPreview(data)}
                    </div>
                </div>
            </div>
            
            <div class="privacy-security">
                <div class="privacy-security-title">🔒 Privacy & Security Notice</div>
                <div class="privacy-security-text">
                    <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
                        <li>This data is shared only with people ${userName} explicitly trusted</li>
                        <li>Please handle this information with the utmost care and confidentiality</li>
                        <li>Do not share this data with unauthorized parties</li>
                        <li>Consider this information sensitive and private</li>
                        <li>If you no longer wish to receive these emails, contact ${userName} to remove you from their Last Wish recipients</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">This is an automated delivery from the Balanze Last Wish system.</p>
                <p class="footer-text">Please handle this information with care and respect for ${userName}'s privacy.</p>
                <p class="footer-text">
                    Delivery Date: ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </p>
                <p class="footer-text">
                    <a href="https://balanze.cash" class="footer-link">Balanze</a> • 
                    Manage your finances with confidence
                </p>
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

    // Generate multiple attachment formats
    const attachments = [];
    const userName = user.user_metadata?.full_name || 'User';
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 1. JSON file (complete data)
    attachments.push({
      filename: `financial-data-${userName}-${dateStr}.json`,
      content: JSON.stringify(filteredData, null, 2),
      contentType: 'application/json'
    });
    
    // 2. HTML report (formatted summary)
    const htmlReport = generateHTMLReport(user, filteredData, settings);
    attachments.push({
      filename: `financial-summary-${userName}-${dateStr}.html`,
      content: htmlReport,
      contentType: 'text/html'
    });
    
    // 3. CSV files for spreadsheet users
    if (filteredData.accounts && filteredData.accounts.length > 0) {
      const accountsCSV = generateAccountsCSV(filteredData.accounts);
      attachments.push({
        filename: `accounts-${userName}-${dateStr}.csv`,
        content: accountsCSV,
        contentType: 'text/csv'
      });
    }
    
    if (filteredData.transactions && filteredData.transactions.length > 0) {
      const transactionsCSV = generateTransactionsCSV(filteredData.transactions);
      attachments.push({
        filename: `transactions-${userName}-${dateStr}.csv`,
        content: transactionsCSV,
        contentType: 'text/csv'
      });
    }

    // Send email
    const mailOptions = {
      from: `"Balanze" <${process.env.SMTP_USER}>`,
      to: recipient.email,
      subject: `Digital Time Capsule Opened: ${userName}'s Financial Information`,
      html: emailContent,
      attachments: attachments
    };

    console.log(`📧 Sending email to: ${recipient.email}`);
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

// Main execution
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('Usage: node email-sender.js <userId>');
    console.log('Example: node email-sender.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }

  const result = await sendLastWishEmailDirect(userId);
  
  if (result.success) {
    console.log('🎉 Last Wish delivery completed successfully!');
    console.log('📧 Results:', result.results);
  } else {
    console.log('❌ Last Wish delivery failed:', result.error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { sendLastWishEmailDirect };
