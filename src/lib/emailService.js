/**
 * Email Service for Last Wish
 * 
 * This service handles sending Last Wish emails using the configured SMTP settings.
 * It's designed to work in a client-side environment by calling a serverless function.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (will be overridden if passed as parameter)
let supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Send Last Wish email to recipients
 * @param {string} userId - The user ID
 * @param {object} customSupabase - Optional custom supabase client to avoid multiple instances
 * @returns {Promise<{success: boolean, message: string, results?: Array}>}
 */
export async function sendLastWishEmail(userId, customSupabase = null) {
  // Use provided supabase client or default one
  const client = customSupabase || supabase;
  try {


    // Get user's Last Wish settings
    const { data: settings, error: settingsError } = await client
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not found');
    }

    // Gather user data

    const userData = await gatherUserData(userId, client);


    // Create email content
    const emailContent = createEmailContent(user, settings, userData);

    // Check if already delivered to prevent duplicates
    const { data: existingDelivery } = await client
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', userId)
      .eq('delivery_status', 'sent')
      .limit(1);

    if (existingDelivery && existingDelivery.length > 0) {

      return {
        success: true,
        message: 'Last Wish already delivered (duplicate prevented)',
        results: [],
        deliveredAt: existingDelivery[0].sent_at,
        successCount: 0,
        failCount: 0
      };
    }

    // Call the API endpoint to send real emails

    
    try {
      const response = await fetch('/api/send-last-wish-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          testMode: false
        })
      });

      const apiResult = await response.json();
      
      if (!response.ok) {
        throw new Error(apiResult.error || 'Email API call failed');
      }


      
      const results = apiResult.results || settings.recipients.map(recipient => ({
        recipient: recipient.email,
        success: apiResult.success,
        messageId: apiResult.messageId || `api-${Date.now()}`
      }));

      return {
        success: true,
        message: apiResult.message || `Last Wish delivered to ${results.length} recipient(s)`,
        results: results,
        deliveredAt: new Date().toISOString(),
        successCount: apiResult.successful || results.filter(r => r.success).length,
        failCount: apiResult.failed || results.filter(r => !r.success).length
      };

    } catch (apiError) {

      
      // Fallback: just log the attempt



      
      const results = settings.recipients.map(recipient => ({
        recipient: recipient.email,
        success: false,
        error: apiError.message,
        messageId: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      return {
        success: false,
        message: `Email delivery failed: ${apiError.message}`,
        results: results,
        deliveredAt: new Date().toISOString(),
        successCount: 0,
        failCount: results.length,
        error: apiError.message
      };
    }

  } catch (error) {

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Gather user's financial data
 */
async function gatherUserData(userId, client) {
  const data = {};

  try {
    // Gather accounts
    const { data: accounts } = await client
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    data.accounts = accounts || [];

    // Gather transactions
    const { data: transactions } = await client
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    data.transactions = transactions || [];

    // Gather purchases
    const { data: purchases } = await client
      .from('purchases')
      .select('*')
      .eq('user_id', userId);
    data.purchases = purchases || [];

    // Gather lend/borrow records
    const { data: lendBorrow } = await client
      .from('lend_borrow')
      .select('*')
      .eq('user_id', userId);
    data.lendBorrow = lendBorrow || [];

    // Gather donation/savings records
    const { data: donationSavings } = await client
      .from('donation_saving_records')
      .select('*')
      .eq('user_id', userId);
    data.donationSavings = donationSavings || [];

  } catch (error) {

  }

  return data;
}

/**
 * Create email content
 */
function createEmailContent(user, settings, userData) {
  const totalAccounts = userData.accounts?.length || 0;
  const totalTransactions = userData.transactions?.length || 0;
  const totalPurchases = userData.purchases?.length || 0;
  const totalLendBorrow = userData.lendBorrow?.length || 0;
  const totalSavings = userData.donationSavings?.length || 0;

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

/**
 * Test email service (for development)
 */
export async function testEmailService() {

  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user logged in');
    }

    const result = await sendLastWishEmail(user.id);

    return result;
  } catch (error) {

    return { success: false, error: error.message };
  }
}

