import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

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

// ============================================================================
// UTILITY FUNCTIONS: Email Validation, Retry, Error Logging
// ============================================================================

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for common issues
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email address is too long (max 254 characters)' };
  }

  const localPart = trimmedEmail.split('@')[0];
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long (max 64 characters)' };
  }

  return { valid: true };
}

/**
 * Validates all recipient emails before sending
 * @param {Array} recipients - Array of recipient objects with email property
 * @returns {object} - { valid: boolean, errors: Array, validRecipients: Array }
 */
function validateRecipients(recipients) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return {
      valid: false,
      errors: ['No recipients provided'],
      validRecipients: []
    };
  }

  const errors = [];
  const validRecipients = [];

  recipients.forEach((recipient, index) => {
    if (!recipient || typeof recipient !== 'object') {
      errors.push(`Recipient ${index + 1}: Invalid recipient object`);
      return;
    }

    if (!recipient.email) {
      errors.push(`Recipient ${index + 1}: Email is required`);
      return;
    }

    const emailValidation = validateEmail(recipient.email);
    if (!emailValidation.valid) {
      errors.push(`Recipient ${index + 1} (${recipient.email}): ${emailValidation.error}`);
      return;
    }

    validRecipients.push(recipient);
  });

  return {
    valid: errors.length === 0,
    errors,
    validRecipients
  };
}

/**
 * Sleep/delay utility for retry mechanism
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced error logging with context
 * @param {string} context - Context of the error (e.g., 'sendDataToRecipient', 'gatherUserData')
 * @param {Error} error - Error object
 * @param {object} metadata - Additional metadata for logging
 */
async function logError(context, error, metadata = {}) {
  const errorLog = {
    context,
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };

  // Log to console with structured format
  console.error(`[Last Wish Error] ${context}:`, JSON.stringify(errorLog, null, 2));

  // Log to database if possible
  try {
    await supabase
      .from('last_wish_deliveries')
      .insert({
        user_id: metadata.userId || null,
        recipient_email: metadata.recipientEmail || null,
        delivery_status: 'error',
        error_message: `${context}: ${error.message}`,
        delivery_data: {
          error_log: errorLog,
          metadata: metadata
        },
        sent_at: new Date().toISOString()
      });
  } catch (dbError) {
    // If database logging fails, just log to console
    console.error('[Last Wish] Failed to log error to database:', dbError.message);
  }
}

/**
 * Retry mechanism with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {string} context - Context for error logging
 * @param {object} metadata - Metadata for error logging
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000, context = 'retry', metadata = {}) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors (e.g., validation errors, authentication errors)
      const nonRetryableErrors = [
        'SMTP not configured',
        'Last Wish settings not found',
        'No recipients configured',
        'User not found',
        'Invalid email format',
        'Email is required'
      ];
      
      const shouldNotRetry = nonRetryableErrors.some(msg => error.message.includes(msg));
      if (shouldNotRetry) {
        await logError(context, error, { ...metadata, attempt, maxRetries, skippedRetry: true });
        throw error;
      }

      // If this was the last attempt, don't wait
      if (attempt < maxRetries) {
        // Exponential backoff: delay = initialDelay * 2^attempt
        const delay = initialDelay * Math.pow(2, attempt);
        
        await logError(context, error, {
          ...metadata,
          attempt: attempt + 1,
          maxRetries,
          retryingIn: delay,
          willRetry: true
        });
        
        await sleep(delay);
      } else {
        // Last attempt failed
        await logError(context, error, {
          ...metadata,
          attempt: attempt + 1,
          maxRetries,
          finalAttempt: true,
          willRetry: false
        });
      }
    }
  }
  
  throw lastError;
}

async function gatherUserData(userId) {
  const data = {};
  const metadata = { userId, operation: 'gatherUserData' };

  try {
    // Gather accounts
    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      
      if (accountsError) {
        await logError('gatherUserData', accountsError, { ...metadata, table: 'accounts' });
      }
      data.accounts = accounts || [];
    } catch (error) {
      await logError('gatherUserData', error, { ...metadata, table: 'accounts' });
      data.accounts = [];
    }

    // Gather transactions
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      
      if (transactionsError) {
        await logError('gatherUserData', transactionsError, { ...metadata, table: 'transactions' });
      }
      data.transactions = transactions || [];
    } catch (error) {
      await logError('gatherUserData', error, { ...metadata, table: 'transactions' });
      data.transactions = [];
    }

    // Gather purchases
    try {
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId);
      
      if (purchasesError) {
        await logError('gatherUserData', purchasesError, { ...metadata, table: 'purchases' });
      }
      data.purchases = purchases || [];
    } catch (error) {
      await logError('gatherUserData', error, { ...metadata, table: 'purchases' });
      data.purchases = [];
    }

    // Gather lend/borrow records
    try {
      const { data: lendBorrow, error: lendBorrowError } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('user_id', userId);
      
      if (lendBorrowError) {
        await logError('gatherUserData', lendBorrowError, { ...metadata, table: 'lend_borrow' });
      }
      data.lendBorrow = lendBorrow || [];
    } catch (error) {
      await logError('gatherUserData', error, { ...metadata, table: 'lend_borrow' });
      data.lendBorrow = [];
    }

    // Gather donation/savings records
    try {
      const { data: donationSavings, error: donationSavingsError } = await supabase
        .from('donation_saving_records')
        .select('*')
        .eq('user_id', userId);
      
      if (donationSavingsError) {
        await logError('gatherUserData', donationSavingsError, { ...metadata, table: 'donation_saving_records' });
      }
      data.donationSavings = donationSavings || [];
    } catch (error) {
      await logError('gatherUserData', error, { ...metadata, table: 'donation_saving_records' });
      data.donationSavings = [];
    }

    // Gather investment assets
    try {
      const { data: investmentAssets, error: investmentError } = await supabase
        .from('investment_assets')
        .select('*')
        .eq('user_id', userId);
      
      if (investmentError) {
        await logError('gatherUserData', investmentError, { ...metadata, table: 'investment_assets' });
      }
      data.investmentAssets = investmentAssets || [];
    } catch (error) {
      await logError('gatherUserData', error, { ...metadata, table: 'investment_assets' });
      data.investmentAssets = [];
    }

    return data;
  } catch (error) {
    await logError('gatherUserData', error, { ...metadata, fatal: true });
    throw error;
  }
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

/**
 * Calculate financial metrics from user data
 * @param {object} data - User financial data
 * @returns {object} - Calculated financial metrics
 */
function calculateFinancialMetrics(data) {
  const accounts = data.accounts || [];
  const transactions = data.transactions || [];
  const lendBorrow = data.lendBorrow || [];
  const investmentAssets = data.investmentAssets || [];
  
  // Calculate total account balances
  const totalAssets = accounts.reduce((sum, account) => {
    return sum + (parseFloat(account.balance) || 0);
  }, 0);
  
  // Calculate investment portfolio value
  const investmentPortfolio = investmentAssets.reduce((sum, asset) => {
    return sum + (parseFloat(asset.current_value || asset.total_value || 0) || 0);
  }, 0);
  
  // Calculate outstanding debts (borrowed amounts that are still active)
  const outstandingDebts = lendBorrow
    .filter(lb => lb.type === 'borrowed' && lb.status === 'active')
    .reduce((sum, lb) => sum + (parseFloat(lb.amount) || 0), 0);
  
  // Calculate amounts owed to user (lent amounts that are still active)
  const amountsOwed = lendBorrow
    .filter(lb => lb.type === 'lent' && lb.status === 'active')
    .reduce((sum, lb) => sum + (parseFloat(lb.amount) || 0), 0);
  
  // Net worth = Total assets + Investments - Outstanding debts + Amounts owed
  const netWorth = totalAssets + investmentPortfolio - outstandingDebts + amountsOwed;
  
  // Format currency helper
  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Get primary currency
  const primaryCurrency = accounts.length > 0 ? (accounts[0].currency || 'USD') : 'USD';
  
  // Account breakdown
  const accountBreakdown = accounts.map(acc => ({
    name: acc.name || 'Unnamed Account',
    balance: parseFloat(acc.balance) || 0,
    currency: acc.currency || primaryCurrency,
    type: acc.type || 'other'
  }));
  
  return {
    totalAssets,
    investmentPortfolio,
    outstandingDebts,
    amountsOwed,
    netWorth,
    primaryCurrency,
    accountBreakdown,
    formatCurrency: (amount) => formatCurrency(amount, primaryCurrency)
  };
}

/**
 * Calculate date information for Last Wish context
 * @param {object} settings - Last Wish settings
 * @param {object} data - User financial data
 * @returns {object} - Date information
 */
function calculateDateInfo(settings, data) {
  const now = new Date();
  
  // Get Last Wish setup date
  const setupDate = settings.created_at 
    ? new Date(settings.created_at)
    : settings.updated_at 
      ? new Date(settings.updated_at)
      : null;
  
  // Get last activity date (from most recent transaction or account update)
  const transactions = data.transactions || [];
  const accounts = data.accounts || [];
  
  let lastActivityDate = null;
  
  // Check transactions
  if (transactions.length > 0) {
    const transactionDates = transactions
      .map(t => new Date(t.created_at || t.date))
      .filter(d => !isNaN(d.getTime()));
    if (transactionDates.length > 0) {
      lastActivityDate = new Date(Math.max(...transactionDates.map(d => d.getTime())));
    }
  }
  
  // Check account updates
  if (accounts.length > 0) {
    const accountDates = accounts
      .map(a => new Date(a.updated_at || a.created_at))
      .filter(d => !isNaN(d.getTime()));
    if (accountDates.length > 0) {
      const latestAccountDate = new Date(Math.max(...accountDates.map(d => d.getTime())));
      if (!lastActivityDate || latestAccountDate > lastActivityDate) {
        lastActivityDate = latestAccountDate;
      }
    }
  }
  
  // Calculate inactivity period
  let inactivityPeriod = null;
  if (lastActivityDate) {
    const diffTime = now - lastActivityDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    inactivityPeriod = diffDays;
  }
  
  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Get inactivity threshold from settings
  const inactivityThreshold = settings.inactivity_days || 30;
  
  return {
    setupDate,
    lastActivityDate,
    inactivityPeriod,
    inactivityThreshold,
    deliveryDate: now,
    formatDate
  };
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

  // Calculate financial metrics
  const metrics = calculateFinancialMetrics(data);
  
  // Calculate date information
  const dateInfo = calculateDateInfo(settings, data);

  // Test mode indicator (dark theme compatible)
  const testModeIndicator = isTestMode ? `
    <div style="background: #1a1f2e; border: 2px solid #6b7280; padding: 20px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
      <h3 style="color: #9ca3af; margin: 0 0 10px 0; font-size: 18px;">🧪 TEST MODE</h3>
      <p style="color: #d1d5db; margin: 0;">This is a test email from the Last Wish system. No real financial data is being delivered.</p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="color-scheme" content="dark">
      <meta name="supported-color-schemes" content="dark">
      <title>${isTestMode ? 'Test Email - ' : ''}Last Wish Delivery - Important Financial Information</title>
      <!--[if mso]>
      <style type="text/css">
          body, table, td {font-family: Arial, sans-serif !important;}
      </style>
      <![endif]-->
      <style>
        /* Reset and Base Styles */
        body {
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.7;
          color: #e5e7eb;
          background: #000000;
        }
        table {
          border-collapse: collapse;
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
          -ms-interpolation-mode: bicubic;
        }
        
        /* Email Wrapper */
        .email-wrapper {
          background: #000000;
          padding: 40px 20px;
        }
        .email-container {
          max-width: 650px;
          margin: 0 auto;
          background: #111827;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          border: 1px solid #1f2937;
        }
        
        /* Header */
        .email-header {
          background: #1f2937;
          color: #e5e7eb;
          padding: 50px 40px;
          text-align: center;
          border-bottom: 2px solid #374151;
        }
        .email-header h1 {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 600;
          color: #f9fafb;
          letter-spacing: 1.5px;
          line-height: 1.3;
        }
        .email-header p {
          margin: 0;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 300;
          letter-spacing: 0.8px;
          line-height: 1.5;
        }
        
        /* Body */
        .email-body {
          padding: 45px 40px;
          background: #111827;
        }
        
        /* Typography Improvements */
        .greeting {
          margin-bottom: 35px;
          padding-bottom: 30px;
          border-bottom: 1px solid #374151;
        }
        .greeting h2 {
          color: #f9fafb;
          font-size: 24px;
          margin: 0 0 16px 0;
          font-weight: 500;
          letter-spacing: 0.3px;
          line-height: 1.4;
        }
        .greeting p {
          color: #d1d5db;
          margin: 0;
          line-height: 1.85;
          font-size: 15px;
          letter-spacing: 0.2px;
        }
        
        /* Acknowledgment Section */
        .acknowledgment {
          background: #1a1f2e;
          border-left: 3px solid #6b7280;
          padding: 28px;
          border-radius: 6px;
          margin-bottom: 30px;
        }
        .acknowledgment p {
          color: #d1d5db;
          margin: 0;
          line-height: 1.8;
          font-size: 14px;
          letter-spacing: 0.1px;
        }
        
        /* Info Cards */
        .info-card {
          background: #1f2937;
          border-left: 3px solid #4b5563;
          padding: 28px;
          border-radius: 6px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .info-card h3 {
          color: #f3f4f6;
          margin: 0 0 14px 0;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.3px;
          line-height: 1.4;
        }
        .info-card p {
          color: #d1d5db;
          margin: 0;
          line-height: 1.75;
          font-size: 14px;
          letter-spacing: 0.1px;
        }
        .info-card strong {
          color: #f9fafb;
          font-weight: 600;
        }
        .info-card .meta-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #374151;
        }
        .info-card .meta-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
        }
        .info-card .meta-label {
          color: #9ca3af;
        }
        .info-card .meta-value {
          color: #e5e7eb;
          font-weight: 500;
        }
        
        /* Message Card */
        .message-card {
          background: #1f2937;
          border-left: 3px solid #6b7280;
          padding: 28px;
          border-radius: 6px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .message-card h3 {
          color: #f3f4f6;
          margin: 0 0 14px 0;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .message-card p {
          color: #d1d5db;
          margin: 0;
          line-height: 1.8;
          font-size: 15px;
          font-style: italic;
          letter-spacing: 0.1px;
        }
        
        /* Financial Metrics */
        .financial-metrics {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 6px;
          padding: 32px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .financial-metrics h3 {
          color: #f9fafb;
          margin: 0 0 24px 0;
          font-size: 19px;
          font-weight: 600;
          letter-spacing: 0.5px;
          line-height: 1.3;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .metric-item {
          background: #111827;
          padding: 20px;
          border-radius: 6px;
          border: 1px solid #374151;
          text-align: center;
          transition: all 0.2s ease;
        }
        .metric-item:hover {
          background: #1a1f2e;
          border-color: #4b5563;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .metric-label {
          color: #9ca3af;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 10px;
          font-weight: 500;
          line-height: 1.4;
        }
        .metric-value {
          color: #f9fafb;
          font-size: 26px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0.5px;
        }
        .metric-subvalue {
          color: #9ca3af;
          font-size: 12px;
          margin-top: 6px;
          font-weight: 400;
        }
        
        /* Account Breakdown */
        .account-breakdown {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #374151;
        }
        .account-breakdown h4 {
          color: #f3f4f6;
          margin: 0 0 16px 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .account-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .account-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #374151;
        }
        .account-item:last-child {
          border-bottom: none;
        }
        .account-name {
          color: #d1d5db;
          font-size: 14px;
        }
        .account-balance {
          color: #f9fafb;
          font-size: 15px;
          font-weight: 600;
        }
        
        /* Data Summary */
        .data-summary {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 6px;
          padding: 32px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .data-summary h3 {
          color: #f9fafb;
          margin: 0 0 20px 0;
          font-size: 19px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .data-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .data-item {
          background: #111827;
          padding: 18px;
          border-radius: 6px;
          border: 1px solid #374151;
          text-align: center;
          transition: all 0.2s ease;
        }
        .data-item:hover {
          background: #1a1f2e;
          border-color: #4b5563;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .data-item-label {
          color: #9ca3af;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .data-item-value {
          color: #f9fafb;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        /* Attachment Card */
        .attachment-card {
          background: #1f2937;
          border: 1px solid #374151;
          border-left: 3px solid #6b7280;
          border-radius: 6px;
          padding: 28px;
          margin-bottom: 28px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .attachment-card h3 {
          color: #f3f4f6;
          margin: 0 0 18px 0;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .file-badge {
          display: inline-block;
          background: #111827;
          padding: 12px 20px;
          border-radius: 4px;
          margin: 8px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #d1d5db;
          font-weight: 500;
          border: 1px solid #374151;
          transition: all 0.2s ease;
        }
        .file-badge:hover {
          background: #1a1f2e;
          border-color: #4b5563;
        }
        
        /* Privacy Card */
        .privacy-card {
          background: #1f2937;
          border-left: 3px solid #6b7280;
          padding: 28px;
          border-radius: 6px;
          margin-bottom: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .privacy-card h3 {
          color: #f3f4f6;
          margin: 0 0 14px 0;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .privacy-card p {
          color: #d1d5db;
          margin: 0;
          line-height: 1.75;
          font-size: 14px;
          letter-spacing: 0.1px;
        }
        
        /* Divider */
        .divider {
          height: 1px;
          background: #374151;
          margin: 32px 0;
          border: none;
        }
        
        /* Footer */
        .email-footer {
          background: #0f172a;
          color: #9ca3af;
          padding: 32px 40px;
          text-align: center;
          border-top: 1px solid #1f2937;
        }
        .email-footer p {
          margin: 8px 0;
          font-size: 12px;
          line-height: 1.6;
          letter-spacing: 0.2px;
        }
        .email-footer strong {
          font-size: 13px;
          color: #d1d5db;
          font-weight: 600;
        }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
          .email-wrapper {
            padding: 20px 10px;
          }
          .email-body {
            padding: 30px 20px;
          }
          .email-header {
            padding: 40px 30px;
          }
          .email-header h1 {
            font-size: 24px;
          }
          .greeting h2 {
            font-size: 20px;
          }
          .metrics-grid,
          .data-grid {
            grid-template-columns: 1fr;
          }
          .info-card,
          .message-card,
          .financial-metrics,
          .data-summary,
          .attachment-card,
          .privacy-card {
            padding: 20px;
          }
          .email-footer {
            padding: 24px 20px;
          }
        }
        
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          body {
            background: #000000;
          }
        }
      </style>
      <!--[if mso]>
      <style type="text/css">
      .email-container {
        width: 650px !important;
      }
      .email-body {
        padding: 45px 40px !important;
      }
      </style>
      <![endif]-->
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          ${testModeIndicator}
          
          <!-- Email Header -->
          <div class="email-header">
            <h1>Last Wish Delivery</h1>
            <p>Important Financial Information</p>
          </div>

          <!-- Email Body -->
          <div class="email-body">
            <!-- Greeting -->
            <div class="greeting">
              <h2>Dear ${recipientName},</h2>
              <p>
                We are reaching out to you with important information regarding the financial records of <strong>${userName}</strong>, who designated you as a trusted recipient through the Last Wish system.
              </p>
            </div>

            <!-- Acknowledgment -->
            <div class="acknowledgment">
              <p>
                We understand that receiving this information may come during a difficult time. Please know that this delivery is part of a system designed to ensure continuity and care for loved ones, and we extend our deepest sympathies and support.
              </p>
            </div>

            <div class="divider"></div>

            <!-- Context Info Card -->
            <div class="info-card">
              <h3>About This Delivery</h3>
              <p>
                <strong>${userName}</strong> established a Last Wish system to ensure their financial records would be securely delivered to designated individuals in the event they were no longer able to manage their affairs. The Last Wish system is designed to provide peace of mind and ensure that important financial information reaches those who need it most.
              </p>
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">Last Wish Established:</span>
                  <span class="meta-value">${dateInfo.setupDate ? dateInfo.formatDate(dateInfo.setupDate) : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Last Account Activity:</span>
                  <span class="meta-value">${dateInfo.lastActivityDate ? dateInfo.formatDate(dateInfo.lastActivityDate) : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Inactivity Period:</span>
                  <span class="meta-value">${dateInfo.inactivityPeriod !== null ? dateInfo.inactivityPeriod + ' days' : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Delivery Trigger:</span>
                  <span class="meta-value">Extended inactivity (${dateInfo.inactivityThreshold}-day threshold)</span>
                </div>
              </div>
            </div>

            ${settings.message ? `
              <!-- Personal Message Card -->
              <div class="message-card">
                <h3>Personal Message from ${userName}</h3>
                <p>${settings.message}</p>
              </div>
            ` : ''}

            <div class="divider"></div>

            <!-- Financial Metrics -->
            <div class="financial-metrics">
              <h3>Financial Overview</h3>
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-label">Total Assets</div>
                  <div class="metric-value">${metrics.formatCurrency(metrics.totalAssets)}</div>
                  <div class="metric-subvalue">Across ${totalAccounts} account${totalAccounts !== 1 ? 's' : ''}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Net Worth</div>
                  <div class="metric-value">${metrics.formatCurrency(metrics.netWorth)}</div>
                  <div class="metric-subvalue">After liabilities</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Outstanding Debts</div>
                  <div class="metric-value">${metrics.formatCurrency(metrics.outstandingDebts)}</div>
                  <div class="metric-subvalue">Credit cards & loans</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">Investment Portfolio</div>
                  <div class="metric-value">${metrics.formatCurrency(metrics.investmentPortfolio)}</div>
                  <div class="metric-subvalue">Current value</div>
                </div>
              </div>
              
              ${metrics.accountBreakdown.length > 0 ? `
                <div class="account-breakdown">
                  <h4>Account Breakdown</h4>
                  <ul class="account-list">
                    ${metrics.accountBreakdown.map(acc => `
                      <li class="account-item">
                        <span class="account-name">${acc.name}</span>
                        <span class="account-balance">${metrics.formatCurrency(acc.balance, acc.currency)}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            <!-- Data Summary -->
            <div class="data-summary">
              <h3>Financial Records Summary</h3>
              <div class="data-grid">
                ${totalAccounts > 0 ? `
                  <div class="data-item">
                    <div class="data-item-label">Bank Accounts</div>
                    <div class="data-item-value">${totalAccounts}</div>
                  </div>
                ` : ''}
                ${totalTransactions > 0 ? `
                  <div class="data-item">
                    <div class="data-item-label">Transactions</div>
                    <div class="data-item-value">${totalTransactions}</div>
                  </div>
                ` : ''}
                ${totalPurchases > 0 ? `
                  <div class="data-item">
                    <div class="data-item-label">Purchases</div>
                    <div class="data-item-value">${totalPurchases}</div>
                  </div>
                ` : ''}
                ${totalLendBorrow > 0 ? `
                  <div class="data-item">
                    <div class="data-item-label">Lend/Borrow</div>
                    <div class="data-item-value">${totalLendBorrow}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Attachment Card -->
            <div class="attachment-card">
              <h3>Complete Financial Data Attached</h3>
              <div class="file-badge">${isTestMode ? 'test-' : ''}financial-data-backup.json</div>
              <div class="file-badge">${isTestMode ? 'test-' : ''}financial-data-backup.pdf</div>
              <p style="margin-top: 16px; color: #9ca3af; font-size: 13px;">
                These files contain comprehensive financial records, including detailed transaction history, account information, and supporting documents.
              </p>
            </div>

            <div class="divider"></div>

            <!-- Privacy Card -->
            <div class="privacy-card">
              <h3>Confidentiality & Privacy</h3>
              <p>
                This information contains sensitive financial data and personal records. Please store it securely, respect the privacy of the account holder, and only use it as intended. If you have any concerns about receiving this information or need assistance, please contact our support team. This delivery is automated and confidential.
              </p>
            </div>
          </div>

          <!-- Email Footer -->
          <div class="email-footer">
            <p><strong>Last Wish System - Balanze</strong></p>
            <p>Automated delivery • Sent with care and respect</p>
            <p>Delivery Date: ${dateInfo.formatDate(dateInfo.deliveryDate)}</p>
            <p style="margin-top: 16px; font-size: 11px; color: #6b7280;">
              For support or questions, please contact: hello@shalconnects.com
            </p>
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
  const metadata = {
    userId: user.id,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    isTestMode
  };

  // Validate recipient email before attempting to send
  const emailValidation = validateEmail(recipient.email);
  if (!emailValidation.valid) {
    await logError('sendDataToRecipient', new Error(emailValidation.error), {
      ...metadata,
      validationError: true
    });
    return { success: false, error: emailValidation.error, validationError: true };
  }

  // Use retry mechanism for sending email
  return await retryWithBackoff(
    async () => {
      try {
        // Filter data based on user preferences
        const filteredData = filterDataBySettings(userData, settings.include_data);

        // Create email content
        const emailContent = createEmailContent(user, recipient, filteredData, settings, isTestMode);

        // Generate PDF
        const pdfBuffer = await createPDFBuffer(user, recipient, filteredData, settings);

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

        const result = await transporter.sendMail(mailOptions);

        // Log successful delivery
        try {
          await supabase
            .from('last_wish_deliveries')
            .insert({
              user_id: user.id,
              recipient_email: recipient.email,
              delivery_data: filteredData,
              delivery_status: 'sent',
              sent_at: new Date().toISOString()
            });
        } catch (dbError) {
          // Log database error but don't fail the email send
          await logError('sendDataToRecipient', dbError, {
            ...metadata,
            dbLogError: true,
            messageId: result.messageId
          });
        }

        return { success: true, messageId: result.messageId };

      } catch (error) {
        // Enhanced error logging with full context
        await logError('sendDataToRecipient', error, {
          ...metadata,
          errorType: 'sendMail',
          smtpConfigured: !!transporter
        });

        // Log failed delivery attempt
        try {
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
        } catch (dbError) {
          // If database logging fails, error is already logged above
          console.error('[Last Wish] Failed to log failed delivery to database:', dbError.message);
        }

        throw error; // Re-throw to trigger retry mechanism
      }
    },
    3, // maxRetries
    1000, // initialDelay (1 second)
    'sendDataToRecipient',
    metadata
  ).catch(async (error) => {
    // Final failure after all retries
    await logError('sendDataToRecipient', error, {
      ...metadata,
      finalFailure: true,
      allRetriesExhausted: true
    });

    return { success: false, error: error.message };
  });
}

async function sendLastWishEmail(userId, testMode = false) {
  const startTime = Date.now();
  const metadata = { userId, testMode };

  try {
    // Check if SMTP is configured
    if (!transporter) {
      const error = new Error('SMTP not configured. Please set up SMTP settings in environment variables.');
      await logError('sendLastWishEmail', error, { ...metadata, smtpCheck: true });
      throw error;
    }

    // Get user's Last Wish settings with retry
    const settings = await retryWithBackoff(
      async () => {
        const { data, error: settingsError } = await supabase
          .from('last_wish_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (settingsError || !data) {
          throw new Error('Last Wish settings not found');
        }
        return data;
      },
      2, // maxRetries for settings fetch
      500, // initialDelay
      'sendLastWishEmail',
      { ...metadata, operation: 'fetchSettings' }
    );

    // Validate recipients before proceeding
    if (!settings.recipients || settings.recipients.length === 0) {
      const error = new Error('No recipients configured');
      await logError('sendLastWishEmail', error, { ...metadata, validation: true });
      throw error;
    }

    const recipientValidation = validateRecipients(settings.recipients);
    
    if (!recipientValidation.valid) {
      const error = new Error(`Invalid recipients: ${recipientValidation.errors.join('; ')}`);
      await logError('sendLastWishEmail', error, {
        ...metadata,
        validation: true,
        validationErrors: recipientValidation.errors,
        totalRecipients: settings.recipients.length,
        validRecipients: recipientValidation.validRecipients.length
      });
      
      // If no valid recipients, fail immediately
      if (recipientValidation.validRecipients.length === 0) {
        throw error;
      }
      
      // Log warning but continue with valid recipients
      console.warn(`[Last Wish] Some recipients are invalid. Proceeding with ${recipientValidation.validRecipients.length} valid recipient(s).`);
    }

    // Use only valid recipients
    const recipientsToSend = recipientValidation.validRecipients.length > 0 
      ? recipientValidation.validRecipients 
      : settings.recipients;

    // Get user profile with retry
    const user = await retryWithBackoff(
      async () => {
        const { data, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !data) {
          throw new Error('User not found');
        }
        return data;
      },
      2, // maxRetries for user fetch
      500, // initialDelay
      'sendLastWishEmail',
      { ...metadata, operation: 'fetchUser' }
    );

    // Gather user data with error logging
    let userData;
    try {
      userData = await gatherUserData(userId);
    } catch (dataError) {
      await logError('sendLastWishEmail', dataError, {
        ...metadata,
        operation: 'gatherUserData'
      });
      throw new Error(`Failed to gather user data: ${dataError.message}`);
    }

    // Send emails to all valid recipients
    const results = [];
    for (const recipient of recipientsToSend) {
      try {
        const result = await sendDataToRecipient(user.user, recipient, userData, settings, testMode);
        results.push({
          recipient: recipient.email,
          recipientName: recipient.name,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          validationError: result.validationError || false
        });
      } catch (recipientError) {
        // Individual recipient failure - log but continue with others
        await logError('sendLastWishEmail', recipientError, {
          ...metadata,
          operation: 'sendToRecipient',
          recipientEmail: recipient.email
        });
        results.push({
          recipient: recipient.email,
          recipientName: recipient.name,
          success: false,
          error: recipientError.message
        });
      }
    }

    // Mark as delivered (only if not in test mode and at least one email succeeded)
    if (!testMode) {
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        try {
          await supabase
            .from('last_wish_settings')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        } catch (updateError) {
          await logError('sendLastWishEmail', updateError, {
            ...metadata,
            operation: 'updateSettings',
            successCount
          });
          // Don't fail the whole operation if settings update fails
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;

    // Log summary
    console.log(`[Last Wish] Delivery completed for user ${userId}: ${successCount} successful, ${failCount} failed (${duration}ms)`);

    return {
      success: true,
      message: `Last Wish delivered to ${successCount} recipient(s)`,
      results: results,
      deliveredAt: new Date().toISOString(),
      successful: successCount,
      failed: failCount,
      validationErrors: recipientValidation.errors || [],
      duration: duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    await logError('sendLastWishEmail', error, {
      ...metadata,
      finalError: true,
      duration
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: duration
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

    const result = await sendLastWishEmail(userId, testMode);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
