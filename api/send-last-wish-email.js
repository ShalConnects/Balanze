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

export async function gatherUserData(userId) {
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

export function filterDataBySettings(userData, includeSettings) {
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
    return sum + (parseFloat(account.calculated_balance) || 0);
  }, 0);
  
  // Calculate investment portfolio value
  const investmentPortfolio = investmentAssets.reduce((sum, asset) => {
    return sum + (parseFloat(asset.current_value || asset.total_value || 0) || 0);
  }, 0);
  
  // Calculate outstanding debts (borrowed amounts that are still active or overdue)
  const outstandingDebts = lendBorrow
    .filter(lb => (lb.type === 'borrow' || lb.type === 'borrowed') && (lb.status === 'active' || lb.status === 'overdue'))
    .reduce((sum, lb) => sum + (parseFloat(lb.amount) || 0), 0);
  
  // Calculate amounts owed to user (lent amounts that are still active or overdue)
  const amountsOwed = lendBorrow
    .filter(lb => (lb.type === 'lend' || lb.type === 'lent') && (lb.status === 'active' || lb.status === 'overdue'))
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
    balance: parseFloat(acc.calculated_balance) || 0,
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
  
  // Get check-in information
  const lastCheckIn = settings.last_check_in ? new Date(settings.last_check_in) : null;
  const checkInFrequency = settings.check_in_frequency || 30;
  
  // Calculate days overdue
  let daysOverdue = null;
  if (lastCheckIn) {
    const expectedCheckIn = new Date(lastCheckIn);
    expectedCheckIn.setDate(expectedCheckIn.getDate() + checkInFrequency);
    const diffTime = now - expectedCheckIn;
    if (diffTime > 0) {
      daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      daysOverdue = 0;
    }
  }
  
  return {
    setupDate,
    lastActivityDate,
    inactivityPeriod,
    inactivityThreshold,
    deliveryDate: now,
    lastCheckIn,
    checkInFrequency,
    daysOverdue,
    formatDate
  };
}

export function createEmailContent(user, recipient, data, settings, isTestMode = false) {
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

  // Calculate assets by currency
  const assetsByCurrency = {};
  const accountsByCurrency = {};
  (data.accounts || []).forEach(account => {
    const currency = account.currency || 'USD';
    const balance = parseFloat(account.calculated_balance) || 0;
    
    if (!assetsByCurrency[currency]) {
      assetsByCurrency[currency] = 0;
      accountsByCurrency[currency] = 0;
    }
    assetsByCurrency[currency] += balance;
    accountsByCurrency[currency] += 1;
  });

  // Calculate Lent & Borrow metrics (active and overdue records)
  const activeLendBorrow = (data.lendBorrow || []).filter(lb => lb.status === 'active' || lb.status === 'overdue');
  const activeLent = activeLendBorrow.filter(lb => lb.type === 'lend' || lb.type === 'lent');
  const activeBorrowed = activeLendBorrow.filter(lb => lb.type === 'borrow' || lb.type === 'borrowed');
  
  // Calculate totals by currency for lent
  const lentByCurrency = {};
  activeLent.forEach(lb => {
    const currency = lb.currency || 'USD';
    if (!lentByCurrency[currency]) {
      lentByCurrency[currency] = 0;
    }
    lentByCurrency[currency] += parseFloat(lb.amount) || 0;
  });
  
  // Calculate totals by currency for borrowed
  const borrowedByCurrency = {};
  activeBorrowed.forEach(lb => {
    const currency = lb.currency || 'USD';
    if (!borrowedByCurrency[currency]) {
      borrowedByCurrency[currency] = 0;
    }
    borrowedByCurrency[currency] += parseFloat(lb.amount) || 0;
  });

  // Currency formatting helper
  const formatCurrencyWithSymbol = (amount, currency = 'USD') => {
    const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
        
        /* Financial Summary */
        .financial-summary {
          margin-bottom: 28px;
        }
        .financial-summary h3 {
          color: #f9fafb;
          margin: 0 0 20px 0;
          font-size: 19px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .summary-item {
          background: #111827;
          padding: 18px;
          border-radius: 6px;
          border: 1px solid #374151;
          text-align: center;
        }
        .summary-label {
          color: #9ca3af;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .summary-value {
          color: #f9fafb;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .summary-subvalue {
          color: #6b7280;
          font-size: 12px;
        }
        .summary-section {
          background: #111827;
          padding: 18px;
          border-radius: 6px;
          border: 1px solid #374151;
          margin-top: 16px;
        }
        .summary-section h4 {
          color: #f3f4f6;
          font-size: 14px;
          margin: 0 0 12px 0;
          font-weight: 600;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid #374151;
        }
        .summary-row:last-child {
          border-bottom: none;
        }
        .summary-row-label {
          color: #9ca3af;
        }
        .summary-row-value {
          color: #e5e7eb;
          font-weight: 500;
        }
        .summary-row-value.positive {
          color: #48bb78;
        }
        .summary-row-value.negative {
          color: #f56565;
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
              <p>
                We understand that receiving this information may come during a difficult time. Please know that this delivery is part of a system designed to ensure continuity and care for loved ones, and we extend our deepest sympathies and support.
              </p>
            </div>

            ${settings.message && settings.message.trim() && 
              settings.message.trim() !== 'This is the personal message' && 
              settings.message.trim() !== 'Create documentation to accompany your financial data' &&
              !settings.message.trim().toLowerCase().includes('create documentation') &&
              !settings.message.trim().toLowerCase().includes('legacy documentation') &&
              settings.message.trim().length > 10 ? `
              <!-- Personal Message Card -->
              <div class="message-card">
                <h3>Personal Message from ${userName}</h3>
                <p style="color: #d1d5db; margin: 0; line-height: 1.8; font-size: 15px; font-style: italic; letter-spacing: 0.1px;">${settings.message.trim()}</p>
              </div>
            ` : ''}

            <div class="divider"></div>

            <!-- Financial Summary -->
            <div class="financial-summary">
              <h3>Financial Summary</h3>
              <div class="summary-grid">
                ${Object.entries(assetsByCurrency).map(([currency, amount]) => `
                  <div class="summary-item">
                    <div class="summary-label">Total Assets (${currency})</div>
                    <div class="summary-value">${formatCurrencyWithSymbol(amount, currency)}</div>
                    <div class="summary-subvalue">${accountsByCurrency[currency] || 0} account${(accountsByCurrency[currency] || 0) !== 1 ? 's' : ''}</div>
                  </div>
                `).join('')}
                ${Object.keys(assetsByCurrency).length === 0 ? `
                  <div class="summary-item">
                    <div class="summary-label">Total Assets</div>
                    <div class="summary-value">${formatCurrencyWithSymbol(0, 'USD')}</div>
                    <div class="summary-subvalue">0 accounts</div>
                  </div>
                ` : ''}
              </div>
              <div class="summary-section">
                <h4>Account Summary</h4>
                <div class="summary-row">
                  <span class="summary-row-label">Total Accounts: </span>
                  <span class="summary-row-value">${totalAccounts} account${totalAccounts !== 1 ? 's' : ''}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-row-label">Currencies: </span>
                  <span class="summary-row-value">${Object.keys(assetsByCurrency).length > 0 ? Object.keys(assetsByCurrency).join(', ') : 'N/A'}</span>
                </div>
              </div>
              <div class="summary-section">
                <h4>Lend/Borrow Summary</h4>
                <div class="summary-row">
                  <span class="summary-row-label">Total Lent: </span>
                  <span class="summary-row-value positive">${Object.keys(lentByCurrency).length > 0 ? Object.entries(lentByCurrency).map(([currency, amount]) => formatCurrencyWithSymbol(amount, currency)).join(', ') : formatCurrencyWithSymbol(0, 'USD')}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-row-label">Total Borrowed: </span>
                  <span class="summary-row-value negative">${Object.keys(borrowedByCurrency).length > 0 ? Object.entries(borrowedByCurrency).map(([currency, amount]) => formatCurrencyWithSymbol(amount, currency)).join(', ') : formatCurrencyWithSymbol(0, 'USD')}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-row-label">Active Records: </span>
                  <span class="summary-row-value">${activeLendBorrow.length} record${activeLendBorrow.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Attachment Card -->
            <div class="attachment-card">
              <h3>Financial Data Attached</h3>
              <div class="file-badge">${isTestMode ? 'test-' : ''}financial-data-backup.pdf</div>
              <p style="margin-top: 16px; color: #9ca3af; font-size: 13px;">
                A PDF document containing the financial records you have been designated to receive.
              </p>
            </div>

            <div class="divider"></div>

            <!-- Context Info Card -->
            <div class="info-card">
              <h3>About This Delivery</h3>
              <p>
                This delivery was automatically triggered because <strong>${userName}</strong> had not checked in within the specified time period (${dateInfo.checkInFrequency || 'N/A'} days).
              </p>
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">Last Check-in:</span>
                  <span class="meta-value">${dateInfo.lastCheckIn ? dateInfo.formatDate(dateInfo.lastCheckIn) : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Last Account Activity:</span>
                  <span class="meta-value">${dateInfo.lastActivityDate ? dateInfo.formatDate(dateInfo.lastActivityDate) : 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Days Overdue:</span>
                  <span class="meta-value">${dateInfo.daysOverdue !== null && dateInfo.daysOverdue !== undefined ? dateInfo.daysOverdue + ' days' : 'N/A'}</span>
                </div>
              </div>
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
            <p><strong>Balanze</strong></p>
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

/**
 * Generate CSV export for financial data
 * @param {object} data - User financial data
 * @param {object} settings - Last Wish settings
 * @returns {string} - CSV content
 */
function generateCSVExport(data, settings) {
  const csvRows = [];
  
  // Helper to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Helper to format currency
  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Math.abs(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Header
  csvRows.push('Last Wish Financial Data Export');
  csvRows.push(`Generated: ${new Date().toISOString()}`);
  csvRows.push('');
  
  // Accounts Section
  if (data.accounts && data.accounts.length > 0) {
    csvRows.push('=== BANK ACCOUNTS ===');
    csvRows.push('Name,Type,Balance,Currency,Account Number,Institution');
    data.accounts.forEach(acc => {
      csvRows.push([
        escapeCSV(acc.name || 'N/A'),
        escapeCSV(acc.type || 'N/A'),
        escapeCSV(acc.calculated_balance || 0),
        escapeCSV(acc.currency || 'USD'),
        escapeCSV(acc.account_number || 'N/A'),
        escapeCSV(acc.institution || 'N/A')
      ].join(','));
    });
    csvRows.push('');
  }
  
  // Transactions Section
  if (data.transactions && data.transactions.length > 0) {
    csvRows.push('=== TRANSACTIONS ===');
    csvRows.push('Date,Description,Amount,Currency,Category,Account,Type');
    data.transactions.forEach(tx => {
      csvRows.push([
        escapeCSV(tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'N/A'),
        escapeCSV(tx.description || 'N/A'),
        escapeCSV(tx.amount || 0),
        escapeCSV(tx.currency || 'USD'),
        escapeCSV(tx.category || 'N/A'),
        escapeCSV(tx.account_name || 'N/A'),
        escapeCSV(tx.type || 'N/A')
      ].join(','));
    });
    csvRows.push('');
  }
  
  // Purchases Section
  if (data.purchases && data.purchases.length > 0) {
    csvRows.push('=== PURCHASES ===');
    csvRows.push('Name,Amount,Status,Target Date,Priority,Notes');
    data.purchases.forEach(purchase => {
      csvRows.push([
        escapeCSV(purchase.name || 'N/A'),
        escapeCSV(purchase.amount || 0),
        escapeCSV(purchase.status || 'N/A'),
        escapeCSV(purchase.target_date ? new Date(purchase.target_date).toISOString().split('T')[0] : 'N/A'),
        escapeCSV(purchase.priority || 'N/A'),
        escapeCSV(purchase.notes || 'N/A')
      ].join(','));
    });
    csvRows.push('');
  }
  
  // Lend/Borrow Section
  if (data.lendBorrow && data.lendBorrow.length > 0) {
    csvRows.push('=== LEND/BORROW RECORDS ===');
    csvRows.push('Type,Person/Entity,Amount,Currency,Status,Due Date,Notes');
    data.lendBorrow.forEach(lb => {
      csvRows.push([
        escapeCSV(lb.type || 'N/A'),
        escapeCSV(lb.person || lb.entity || 'N/A'),
        escapeCSV(lb.amount || 0),
        escapeCSV(lb.currency || 'USD'),
        escapeCSV(lb.status || 'N/A'),
        escapeCSV(lb.due_date ? new Date(lb.due_date).toISOString().split('T')[0] : 'N/A'),
        escapeCSV(lb.notes || 'N/A')
      ].join(','));
    });
    csvRows.push('');
  }
  
  // Savings/Donation Records Section
  if (data.donationSavings && data.donationSavings.length > 0) {
    csvRows.push('=== SAVINGS/DONATION RECORDS ===');
    csvRows.push('Type,Name,Target Amount,Current Amount,Currency,Status,Target Date,Notes');
    data.donationSavings.forEach(ds => {
      csvRows.push([
        escapeCSV(ds.type || 'N/A'),
        escapeCSV(ds.name || 'N/A'),
        escapeCSV(ds.target_amount || 0),
        escapeCSV(ds.current_amount || 0),
        escapeCSV(ds.currency || 'USD'),
        escapeCSV(ds.status || 'N/A'),
        escapeCSV(ds.target_date ? new Date(ds.target_date).toISOString().split('T')[0] : 'N/A'),
        escapeCSV(ds.notes || 'N/A')
      ].join(','));
    });
    csvRows.push('');
  }
  
  // Investment Assets Section
  if (data.investmentAssets && data.investmentAssets.length > 0) {
    csvRows.push('=== INVESTMENT ASSETS ===');
    csvRows.push('Name,Type,Current Value,Currency,Purchase Date,Quantity,Notes');
    data.investmentAssets.forEach(asset => {
      csvRows.push([
        escapeCSV(asset.name || 'N/A'),
        escapeCSV(asset.type || 'N/A'),
        escapeCSV(asset.current_value || asset.total_value || 0),
        escapeCSV(asset.currency || 'USD'),
        escapeCSV(asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : 'N/A'),
        escapeCSV(asset.quantity || 'N/A'),
        escapeCSV(asset.notes || 'N/A')
      ].join(','));
    });
    csvRows.push('');
  }
  
  return csvRows.join('\n');
}

// New HTML-to-PDF function using Puppeteer (Vercel-compatible)
async function createPDFFromHTML(user, recipient, data, settings) {
  let browser;
  let puppeteer;
  try {
    console.log('[PDF] Starting Puppeteer PDF generation...');
    // Dynamically import puppeteer-core (lighter, no bundled Chromium)
    puppeteer = await import('puppeteer-core').then(m => m.default).catch(() => null);
    if (!puppeteer) {
      throw new Error('puppeteer-core not installed. Run: npm install puppeteer-core');
    }
    
    // Vercel-compatible Puppeteer configuration
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    // Always use @sparticuz/chromium for serverless environments
    let chromium;
    let executablePath;
    let chromiumArgs = [];
    
    if (isVercel) {
      try {
        chromium = await import('@sparticuz/chromium').then(m => m.default).catch(() => null);
        if (!chromium) {
          throw new Error('@sparticuz/chromium module not found');
        }
        
        // For @sparticuz/chromium, we need to ensure it's properly set up
        // The executablePath() method should return the path to the extracted binary
        executablePath = await chromium.executablePath();
        
        // Get chromium args - these are optimized for serverless
        chromiumArgs = [...(chromium.args || [])];
        
        // Ensure critical args are present
        const requiredArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer'
        ];
        
        requiredArgs.forEach(arg => {
          if (!chromiumArgs.includes(arg)) {
            chromiumArgs.push(arg);
          }
        });
        
        console.log('[PDF] Using @sparticuz/chromium for Vercel:', {
          executablePath: executablePath ? (executablePath.length > 100 ? '...' + executablePath.slice(-100) : executablePath) : 'NOT SET',
          argsCount: chromiumArgs.length,
          hasExecutable: !!executablePath,
          chromiumType: typeof chromium
        });
        
        if (!executablePath) {
          throw new Error('Failed to get chromium executable path from @sparticuz/chromium');
        }
        
        // Verify the executable path doesn't point to /tmp/chromium (which lacks libraries)
        if (executablePath.includes('/tmp/chromium') && !executablePath.includes('@sparticuz')) {
          console.warn('[PDF] Warning: Executable path points to /tmp/chromium, which may lack required libraries');
        }
      } catch (chromiumError) {
        console.error('[PDF] Failed to load/configure @sparticuz/chromium:', {
          message: chromiumError.message,
          stack: chromiumError.stack
        });
        throw new Error(`Chromium not available for serverless environment: ${chromiumError.message}`);
      }
    } else {
      // Local development: try to use system Chrome/Chromium
      // Check if CHROME_PATH is explicitly set
      if (process.env.CHROME_PATH) {
        executablePath = process.env.CHROME_PATH;
        console.log('[PDF] Using Chrome from CHROME_PATH:', executablePath);
      } else {
        // Try common Chrome/Chromium locations
        const { existsSync } = await import('fs');
        const possiblePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
          '/usr/bin/google-chrome', // Linux
          '/usr/bin/chromium', // Linux
          '/usr/bin/chromium-browser' // Linux
        ];
        
        for (const path of possiblePaths) {
          if (existsSync(path)) {
            executablePath = path;
            console.log('[PDF] Using system Chrome:', executablePath);
            break;
          }
        }
        
        if (!executablePath) {
          console.warn('[PDF] Chrome/Chromium not found. Please:');
          console.warn('   1. Install Google Chrome, OR');
          console.warn('   2. Set CHROME_PATH environment variable to Chrome executable path');
          throw new Error('Chrome/Chromium not found. Install Chrome or set CHROME_PATH env variable.');
        }
      }
    }
    
    const launchOptions = {
      headless: true,
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        ...chromiumArgs
      ]
    };
    
    // Add single-process for Vercel (required for serverless)
    if (isVercel) {
      launchOptions.args.push('--single-process', '--no-zygote');
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // Set a timeout for page operations (30 seconds)
    page.setDefaultTimeout(30000);
    
    // Generate HTML content (reuse email HTML but optimized for PDF)
    const htmlContent = createPDFHTMLContent(user, recipient, data, settings);
    
    // Set content and wait for it to load
    // Use 'domcontentloaded' for Vercel (faster, more reliable than networkidle0)
    await page.setContent(htmlContent, { 
      waitUntil: isVercel ? 'domcontentloaded' : 'networkidle0',
      timeout: 30000
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 8px; color: #6b7280; width: 100%; text-align: center; padding: 10px;">Last Wish - Confidential Financial Records</div>',
      footerTemplate: '<div style="font-size: 8px; color: #6b7280; width: 100%; text-align: center; padding: 10px;"><span class="pageNumber"></span> of <span class="totalPages"></span> | Generated: ' + new Date().toLocaleDateString() + ' | Balanze Last Wish System | Method: HTML-to-PDF</div>'
    });
    
    console.log('[PDF] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn('[PDF] Error closing browser:', closeError.message);
      }
    }
    // Log detailed error for debugging
    console.error('[PDF] Puppeteer error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      isVercel: process.env.VERCEL === '1'
    });
    throw error;
  }
}

// Create PDF-optimized HTML content
function createPDFHTMLContent(user, recipient, data, settings) {
  const recipientName = recipient.name || recipient.email;
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account holder';
  
  // Calculate financial metrics
  const metrics = calculateFinancialMetrics(data);
  const dateInfo = calculateDateInfo(settings, data);
  
  // Calculate assets by currency
  const assetsByCurrency = {};
  const accountsByCurrency = {};
  (data.accounts || []).forEach(account => {
    const currency = account.currency || 'USD';
    const balance = parseFloat(account.calculated_balance) || 0;
    if (!assetsByCurrency[currency]) {
      assetsByCurrency[currency] = 0;
      accountsByCurrency[currency] = 0;
    }
    assetsByCurrency[currency] += balance;
    accountsByCurrency[currency] += 1;
  });
  
  // Calculate lend/borrow
  const activeLendBorrow = (data.lendBorrow || []).filter(lb => lb.status === 'active' || lb.status === 'overdue');
  const activeLent = activeLendBorrow.filter(lb => lb.type === 'lend' || lb.type === 'lent');
  const activeBorrowed = activeLendBorrow.filter(lb => lb.type === 'borrow' || lb.type === 'borrowed');
  
  const lentByCurrency = {};
  activeLent.forEach(lb => {
    const currency = lb.currency || 'USD';
    if (!lentByCurrency[currency]) lentByCurrency[currency] = 0;
    lentByCurrency[currency] += parseFloat(lb.amount) || 0;
  });
  
  const borrowedByCurrency = {};
  activeBorrowed.forEach(lb => {
    const currency = lb.currency || 'USD';
    if (!borrowedByCurrency[currency]) borrowedByCurrency[currency] = 0;
    borrowedByCurrency[currency] += parseFloat(lb.amount) || 0;
  });
  
  const formatCurrencyWithSymbol = (amount, currency = 'USD') => {
    const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const accountsWithBalance = (data.accounts || []).filter(acc => parseFloat(acc.calculated_balance) !== 0);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 0.5in;
    }
    body {
      font-family: Arial, sans-serif;
      color: #111827;
      background: white;
      margin: 0;
      padding: 20px;
    }
    .cover-page {
      text-align: center;
      padding: 100px 0;
    }
    .cover-title {
      font-size: 32px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 10px;
    }
    .cover-subtitle {
      font-size: 16px;
      color: #333333;
      margin-bottom: 40px;
    }
    .section {
      page-break-inside: avoid;
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 15px;
      border-bottom: 2px solid #cccccc;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      page-break-inside: auto;
    }
    th {
      background-color: #1f2937;
      color: #f9fafb;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .summary-grid {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 15px;
      margin-bottom: 20px;
    }
    .summary-row {
      display: table-row;
    }
    .summary-item {
      display: table-cell;
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      width: 50%;
      vertical-align: top;
    }
    .summary-label {
      font-size: 12px;
      color: #333333;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: bold;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="cover-title">Last Wish Delivery</div>
    <div class="cover-subtitle">Confidential Financial Records</div>
    <p>Prepared for: ${recipientName}</p>
    <p>Account Holder: ${userName}</p>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
    <p style="margin-top: 40px; color: #6b7280; font-size: 12px;">CONFIDENTIAL - FOR AUTHORIZED RECIPIENT ONLY</p>
  </div>
  
  <div style="page-break-before: always;" class="section">
    <div class="section-title">Financial Summary</div>
    <div class="summary-grid">
      ${(() => {
        const entries = Object.entries(assetsByCurrency);
        let html = '';
        for (let i = 0; i < entries.length; i += 2) {
          html += '<div class="summary-row">';
          html += `<div class="summary-item">
            <div class="summary-label">Total Assets (${entries[i][0]})</div>
            <div class="summary-value">${formatCurrencyWithSymbol(entries[i][1], entries[i][0])}</div>
            <div style="font-size: 11px; color: #6b7280;">${accountsByCurrency[entries[i][0]]} account${accountsByCurrency[entries[i][0]] !== 1 ? 's' : ''}</div>
          </div>`;
          if (entries[i + 1]) {
            html += `<div class="summary-item">
              <div class="summary-label">Total Assets (${entries[i + 1][0]})</div>
              <div class="summary-value">${formatCurrencyWithSymbol(entries[i + 1][1], entries[i + 1][0])}</div>
              <div style="font-size: 11px; color: #6b7280;">${accountsByCurrency[entries[i + 1][0]]} account${accountsByCurrency[entries[i + 1][0]] !== 1 ? 's' : ''}</div>
            </div>`;
          } else {
            html += '<div class="summary-item"></div>';
          }
          html += '</div>';
        }
        return html;
      })()}
    </div>
    <p><strong>Total Accounts:</strong> ${accountsWithBalance.length}</p>
    <p><strong>Currencies:</strong> ${Object.keys(assetsByCurrency).join(', ') || 'N/A'}</p>
    <p><strong>Total Lent:</strong> ${Object.keys(lentByCurrency).length > 0 ? Object.entries(lentByCurrency).map(([currency, amount]) => formatCurrencyWithSymbol(amount, currency)).join(', ') : formatCurrencyWithSymbol(0, 'USD')}</p>
    <p><strong>Total Borrowed:</strong> ${Object.keys(borrowedByCurrency).length > 0 ? Object.entries(borrowedByCurrency).map(([currency, amount]) => formatCurrencyWithSymbol(amount, currency)).join(', ') : formatCurrencyWithSymbol(0, 'USD')}</p>
    <p><strong>Active Records:</strong> ${activeLendBorrow.length} record${activeLendBorrow.length !== 1 ? 's' : ''}</p>
  </div>
  
  ${accountsWithBalance.length > 0 ? `
    <div style="page-break-before: always;" class="section">
      <div class="section-title">Accounts</div>
      <table>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Type</th>
            <th>Balance</th>
            <th>Currency</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${accountsWithBalance.map(acc => `
            <tr>
              <td>${acc.name || 'N/A'}</td>
              <td>${acc.type || 'N/A'}</td>
              <td>${formatCurrencyWithSymbol(parseFloat(acc.calculated_balance) || 0, acc.currency || 'USD')}</td>
              <td>${acc.currency || 'USD'}</td>
              <td>${(acc.description || '').substring(0, 50) || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}
  
  ${activeLendBorrow.length > 0 ? `
    <div class="section" style="page-break-before: always; page-break-after: avoid;">
      <div class="section-title">Lend/Borrow Records</div>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Person/Entity</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Due Date</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${activeLendBorrow.map(lb => {
            const type = lb.type === 'lent' || lb.type === 'lend' ? 'Lent' : 
                         lb.type === 'borrowed' || lb.type === 'borrow' ? 'Borrowed' : 
                         lb.type || 'N/A';
            return `
              <tr>
                <td>${type}</td>
                <td>${lb.person_name || lb.person || lb.entity || 'N/A'}</td>
                <td>${formatCurrencyWithSymbol(parseFloat(lb.amount) || 0, lb.currency || 'USD')}</td>
                <td>${lb.currency || 'USD'}</td>
                <td>${lb.due_date ? new Date(lb.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>${(lb.notes || '').substring(0, 40) || 'N/A'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}
</body>
</html>`;
}

export async function createPDFBuffer(user, recipient, data, settings) {
  // Use HTML-to-PDF approach for better rendering
  try {
    console.log('[PDF] Attempting HTML-to-PDF with Puppeteer...');
    const pdfBuffer = await createPDFFromHTML(user, recipient, data, settings);
    console.log('[PDF] ✅ Successfully generated PDF using Puppeteer (HTML-to-PDF)');
    console.log('[PDF] PDF size:', pdfBuffer.length, 'bytes');
    return pdfBuffer;
  } catch (error) {
    // Fallback to PDFKit if Puppeteer fails
    // This is expected on Vercel if @sparticuz/chromium has library issues
    const isChromiumError = error.message.includes('libnss3.so') || 
                           error.message.includes('shared libraries') ||
                           error.message.includes('Failed to launch the browser process');
    
    console.error('[PDF] ❌ HTML-to-PDF failed, falling back to PDFKit:', {
      error: error.message,
      isChromiumError: isChromiumError,
      name: error.name
    });
    
    if (isChromiumError) {
      console.warn('[PDF] Chromium library error detected - this is a known Vercel limitation');
      console.warn('[PDF] Falling back to PDFKit which works reliably on all platforms');
    }
    
    console.log('[PDF] Attempting PDFKit (legacy) fallback...');
    const pdfBuffer = createPDFBufferLegacy(user, recipient, data, settings);
    console.log('[PDF] ✅ Generated PDF using PDFKit (legacy fallback)');
    return pdfBuffer;
  }
}

function createPDFBufferLegacy(user, recipient, data, settings) {
  return new Promise((resolve, reject) => {
    try {
      // Calculate financial metrics and date info
      const metrics = calculateFinancialMetrics(data);
      const dateInfo = calculateDateInfo(settings, data);
      
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'LETTER',
        autoFirstPage: true,
        info: {
          Title: 'Last Wish Financial Records',
          Author: 'Balanze Last Wish System',
          Subject: 'Confidential Financial Information',
          Keywords: 'Last Wish, Financial Records, Balanze',
          Creator: 'Balanze Last Wish System',
          Producer: 'Balanze'
        }
      });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // Ensure proper font encoding - use standard Helvetica fonts
      doc.font('Helvetica');
      
      // Helper functions for formatting
      // Use ASCII-safe currency symbols to avoid encoding issues
      const formatCurrency = (amount, currency = 'USD') => {
        const symbols = { 
          USD: '$', 
          BDT: 'BDT ',  // Use text instead of ৳ to avoid Unicode font issues
          EUR: 'EUR ',  // Use text for better compatibility
          GBP: 'GBP ',  // Use text for better compatibility
          JPY: 'JPY ',  // Use text for better compatibility
          INR: 'INR ',  // Use text for better compatibility
          CAD: 'CAD ',  // Use text for better compatibility
          AUD: 'AUD '   // Use text for better compatibility
        };
        const symbol = symbols[currency] || currency + ' ';
        const formattedAmount = Math.abs(amount || 0).toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
        return `${symbol}${formattedAmount}`;
      };
      
      const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
          return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } catch {
          return 'N/A';
        }
      };
      
      // Page tracking system for accurate page numbers
      let totalPages = 1; // Start with 1 for the initial page
      const pageNumbers = new Map(); // Store page numbers for each section
      
      // Track pages as they're added (fires when addPage() is called)
      doc.on('pageAdded', () => {
        totalPages++;
      });
      
      // Add header/footer function with proper page tracking
      const addHeaderFooter = (pageNum, totalPagesCount = null) => {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        
        // Use provided total or get current total from buffered range
        // During generation, bufferedPageRange() gives us the current count
        let finalTotal = totalPagesCount;
        if (finalTotal === null) {
          const range = doc.bufferedPageRange();
          finalTotal = range.count || totalPages;
        }
        
        // Header with CONFIDENTIAL watermark text (subtle)
        doc.save();
        doc.fontSize(8).fillColor('#6b7280');
        doc.text('Last Wish - Confidential Financial Records', 50, 30);
        doc.restore();
        
        // Footer with page numbers and CONFIDENTIAL text
        doc.save();
        doc.fontSize(8).fillColor('#6b7280');
        doc.text(
          `Page ${pageNum} of ${finalTotal} | Generated: ${formatDate(new Date())} | Balanze Last Wish System`,
          50,
          pageHeight - 30,
          { align: 'left', width: pageWidth - 100 }
        );
        doc.text(
          'CONFIDENTIAL - For authorized recipient only',
          pageWidth - 50,
          pageHeight - 30,
          { align: 'right' }
        );
        doc.restore();
      };

      // Get names
      const recipientName = recipient.name || recipient.email;
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account holder';

      // Track current page
      let currentPageNum = 1;
      const getCurrentPage = () => {
        // Get current page from buffered range
        const range = doc.bufferedPageRange();
        return range.start + range.count;
      };
      
      // Helper to add new page with tracking
      const addPageWithHeader = () => {
        doc.addPage();
        // Get current page number after adding
        const range = doc.bufferedPageRange();
        currentPageNum = range.start + range.count;
        addHeaderFooter(currentPageNum);
        return currentPageNum;
      };
      
      // Helper to check remaining space before rendering
      const checkSpace = (neededHeight) => {
        const availableHeight = doc.page.height - doc.y - 80; // 80px for footer
        return availableHeight >= neededHeight;
      };
      
      // Helper to draw table - Enhanced with better styling
      const drawTable = (headers, rows, startY, options = {}) => {
        const tableTop = startY || doc.y;
        const cellPadding = options.padding || 6;
        const fontSize = options.fontSize || 9;
        const headerColor = options.headerColor || '#1f2937';
        const rowColor = options.rowColor || '#ffffff';
        const textColor = options.textColor || '#111827';
        const headerTextColor = options.headerTextColor || '#ffffff';
        const columnWidths = options.columnWidths || [];
        const pageWidth = doc.page.width - 100; // 50px margin on each side
        
        // Calculate column widths if not provided
        let widths = columnWidths;
        if (!widths.length) {
          const colCount = headers.length;
          const colWidth = pageWidth / colCount;
          widths = headers.map(() => colWidth);
        }
        
        let currentY = tableTop;
        const rowHeight = fontSize + (cellPadding * 2) + 6;
        const headerHeight = rowHeight;
        
        // Check if we have space for header + at least one row
        if (!checkSpace(headerHeight + rowHeight + 20)) {
          currentPageNum = addPageWithHeader();
          currentY = 80;
          doc.y = currentY;
        }
        
        // Draw header with border
        doc.save();
        doc.rect(50, currentY, pageWidth, headerHeight)
          .fillColor(headerColor)
          .fill()
          .strokeColor('#000000')
          .lineWidth(1)
          .stroke();
        
        doc.fillColor(headerTextColor).fontSize(fontSize + 1).font('Helvetica-Bold');
        
        let xPos = 50;
        headers.forEach((header, i) => {
          // Ensure header text is properly encoded string
          const headerText = String(header || '');
          doc.text(headerText, xPos + cellPadding, currentY + cellPadding, {
            width: widths[i] - (cellPadding * 2),
            align: 'left'
          });
          // Vertical line between columns
          if (i < headers.length - 1) {
            doc.moveTo(xPos + widths[i], currentY)
              .lineTo(xPos + widths[i], currentY + headerHeight)
              .strokeColor('#374151')
              .lineWidth(0.5)
              .stroke();
          }
          xPos += widths[i];
        });
        doc.restore();
        currentY += headerHeight;
        doc.y = currentY;
        
        // Draw rows with intelligent pagination
        rows.forEach((row, rowIndex) => {
          // Calculate row height based on content (for multi-line cells)
          let maxCellHeight = rowHeight;
          row.forEach((cell, cellIndex) => {
            const cellText = String(cell || 'N/A');
            const cellHeight = doc.heightOfString(cellText, {
              width: widths[cellIndex] - (cellPadding * 2)
            });
            maxCellHeight = Math.max(maxCellHeight, cellHeight + (cellPadding * 2) + 6);
          });
          
          // Check if we need a new page (with better space checking)
          if (!checkSpace(maxCellHeight + 10)) {
            currentPageNum = addPageWithHeader();
            currentY = 80;
            doc.y = currentY;
            
            // Redraw header on new page
            doc.save();
            doc.rect(50, currentY, pageWidth, headerHeight)
              .fillColor(headerColor)
              .fill()
              .strokeColor('#000000')
              .lineWidth(1)
              .stroke();
            doc.fillColor(headerTextColor).fontSize(fontSize + 1).font('Helvetica-Bold');
            xPos = 50;
            headers.forEach((header, i) => {
              // Ensure header text is properly encoded string
              const headerText = String(header || '');
              doc.text(headerText, xPos + cellPadding, currentY + cellPadding, {
                width: widths[i] - (cellPadding * 2),
                align: 'left'
              });
              if (i < headers.length - 1) {
                doc.moveTo(xPos + widths[i], currentY)
                  .lineTo(xPos + widths[i], currentY + headerHeight)
                  .strokeColor('#374151')
                  .lineWidth(0.5)
                  .stroke();
              }
              xPos += widths[i];
            });
            doc.restore();
            currentY += headerHeight;
            doc.y = currentY;
          }
          
          // Draw row
          const bgColor = rowIndex % 2 === 0 ? rowColor : '#f9fafb';
          doc.save();
          doc.rect(50, currentY, pageWidth, maxCellHeight)
            .fillColor(bgColor)
            .fill()
            .strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .stroke();
          
          doc.fillColor(textColor).fontSize(fontSize).font('Helvetica');
          xPos = 50;
          row.forEach((cell, i) => {
            // Ensure cell text is properly encoded string
            const cellText = String(cell || 'N/A');
            // Wrap text properly with explicit encoding
            doc.text(cellText, xPos + cellPadding, currentY + cellPadding, {
              width: widths[i] - (cellPadding * 2),
              align: 'left',
              lineGap: 2
            });
            // Vertical line between columns
            if (i < row.length - 1) {
              doc.moveTo(xPos + widths[i], currentY)
                .lineTo(xPos + widths[i], currentY + maxCellHeight)
                .strokeColor('#e5e7eb')
                .lineWidth(0.5)
                .stroke();
            }
            xPos += widths[i];
          });
          doc.restore();
          currentY += maxCellHeight;
          doc.y = currentY;
        });
        
        doc.y = currentY + 15;
        return currentY;
      };
      
      // COVER PAGE - Enhanced Design (no watermark, only header/footer)
      addHeaderFooter(1);
      
      // Title Section with better spacing (adjusted to prevent cut off)
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      const startY = 200;
      
      // Title - Fixed width calculation
      doc.fillColor('#000000').fontSize(36).font('Helvetica-Bold')
        .text('Last Wish Delivery', margin, startY, { 
          align: 'center', 
          width: contentWidth 
        });
      
      // Subtitle - Fixed width calculation
      doc.fillColor('#374151').fontSize(18).font('Helvetica')
        .text('Important Financial Information', margin, startY + 45, { 
          align: 'center', 
          width: contentWidth 
        });
      
      // Divider line
      doc.moveTo(margin, startY + 80)
        .lineTo(pageWidth - margin, startY + 80)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      
      doc.y = startY + 100;
      
      // Recipient and Account Holder Info with better formatting
      doc.moveDown(2);
      // Prepared for - Fixed width
      doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold')
        .text('Prepared for:', margin, doc.y, { 
          align: 'center', 
          width: contentWidth 
        });
      doc.moveDown(0.3);
      doc.fillColor('#374151').fontSize(14).font('Helvetica')
        .text(String(recipientName), margin, doc.y, { 
          align: 'center', 
          width: contentWidth 
        });
      
      doc.moveDown(1.5);
      // Account Holder - Fixed width
      doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold')
        .text('Account Holder:', margin, doc.y, { 
          align: 'center', 
          width: contentWidth 
        });
      doc.moveDown(0.3);
      doc.fillColor('#374151').fontSize(14).font('Helvetica')
        .text(String(userName), margin, doc.y, { 
          align: 'center', 
          width: contentWidth 
        });
      
      doc.moveDown(2);
      // Generated date - Fixed width
      const generatedDate = formatDate(new Date());
      doc.fillColor('#6b7280').fontSize(11).font('Helvetica')
        .text(`Generated: ${generatedDate}`, margin, doc.y, { 
          align: 'center', 
          width: contentWidth 
        });
      
      // Confidentiality Notice - Enhanced
      doc.y = pageHeight - 150;
      doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      doc.moveDown(1);
      
      doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold')
        .text('CONFIDENTIAL - FOR AUTHORIZED RECIPIENT ONLY', margin, doc.y, { 
          align: 'center', 
          width: contentWidth 
        });
      doc.moveDown(0.8);
      doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
        .text('This document contains sensitive financial information. Handle with care and store securely.', 
          margin, doc.y, { align: 'center', width: contentWidth, lineGap: 2 });
      doc.moveDown(0.5);
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica')
        .text('If you have any concerns about receiving this information, please contact our support team.', 
          margin, doc.y, { align: 'center', width: contentWidth });
      
      currentPageNum = 1;
      pageNumbers.set('cover', 1);
      
      // TABLE OF CONTENTS - Enhanced
      currentPageNum = addPageWithHeader();
      pageNumbers.set('toc', currentPageNum);
      
      // Title with underline
      doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold')
        .text('Table of Contents', 50, 80);
      doc.moveTo(50, 110)
        .lineTo(200, 110)
        .strokeColor('#000000')
        .lineWidth(2)
        .stroke();
      
      doc.y = 130;
      doc.moveDown(0.5);
      
      let tocY = doc.y;
      const tocItems = [];
      
      // Filter accounts to exclude zero balances
      const accountsWithBalance = (data.accounts || []).filter(acc => parseFloat(acc.calculated_balance) !== 0);
      
      // Filter lend/borrow to active and overdue records
      const activeLendBorrow = (data.lendBorrow || []).filter(lb => lb.status === 'active' || lb.status === 'overdue');
      
      // Filter investment assets
      const investmentAssets = (data.investmentAssets || []).filter(asset => 
        parseFloat(asset.current_value || asset.total_value || 0) > 0
      );
      
      // Filter savings/donation records
      const savingsRecords = (data.donationSavings || []).filter(ds => 
        parseFloat(ds.current_amount || 0) > 0 || parseFloat(ds.target_amount || 0) > 0
      );
      
      // Calculate page numbers
      let tocPageNum = 3; // Financial Summary page
      tocItems.push({ title: 'Financial Summary', page: tocPageNum });
      tocPageNum++;
      
      if (accountsWithBalance.length > 0) {
        const currencies = [...new Set(accountsWithBalance.map(acc => acc.currency || 'USD'))];
        currencies.forEach((currency) => {
          tocItems.push({ title: `Accounts - ${currency}`, page: tocPageNum });
          tocPageNum++;
        });
      }
      
      if (investmentAssets.length > 0) {
        tocItems.push({ title: 'Investment Assets', page: tocPageNum });
        tocPageNum++;
      }
      
      if (savingsRecords.length > 0) {
        tocItems.push({ title: 'Savings & Donation Records', page: tocPageNum });
        tocPageNum++;
      }
      
      if (activeLendBorrow.length > 0) {
        tocItems.push({ title: 'Lend/Borrow Records', page: tocPageNum });
      }
      
      // Draw TOC items with better formatting
      tocItems.forEach((item, index) => {
        const yPos = tocY + (index * 18);
        doc.fillColor('#111827').fontSize(11).font('Helvetica')
          .text(item.title, 50, yPos, { width: doc.page.width - 150 });
        
        // Dotted line
        const dotStartX = doc.widthOfString(item.title, { width: doc.page.width - 150 }) + 60;
        const dotEndX = doc.page.width - 80;
        const dotY = yPos + 5;
        
        // Draw dots
        for (let x = dotStartX; x < dotEndX; x += 3) {
          doc.circle(x, dotY, 0.5).fillColor('#9ca3af').fill();
        }
        
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica')
          .text(`${item.page}`, dotEndX + 5, yPos, { align: 'right' });
      });

      // FINANCIAL SUMMARY PAGE - Enhanced
      currentPageNum = addPageWithHeader();
      pageNumbers.set('financialSummary', currentPageNum);
      
      // Title with underline
      doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold')
        .text('Financial Summary', 50, 80);
      doc.moveTo(50, 110)
        .lineTo(250, 110)
        .strokeColor('#000000')
        .lineWidth(2)
        .stroke();
      
      doc.y = 130;
      doc.moveDown(1);
      
      // Calculate assets by currency
      const assetsByCurrency = {};
      const accountsByCurrency = {};
      (data.accounts || []).forEach(account => {
        const currency = account.currency || 'USD';
        const balance = parseFloat(account.calculated_balance) || 0;
        if (!assetsByCurrency[currency]) {
          assetsByCurrency[currency] = 0;
          accountsByCurrency[currency] = 0;
        }
        assetsByCurrency[currency] += balance;
        accountsByCurrency[currency] += 1;
      });
      
      // Calculate lend/borrow totals
      const activeLent = activeLendBorrow.filter(lb => lb.type === 'lend' || lb.type === 'lent');
      const activeBorrowed = activeLendBorrow.filter(lb => lb.type === 'borrow' || lb.type === 'borrowed');
      
      const lentByCurrency = {};
      activeLent.forEach(lb => {
        const currency = lb.currency || 'USD';
        if (!lentByCurrency[currency]) {
          lentByCurrency[currency] = 0;
        }
        lentByCurrency[currency] += parseFloat(lb.amount) || 0;
      });
      
      const borrowedByCurrency = {};
      activeBorrowed.forEach(lb => {
        const currency = lb.currency || 'USD';
        if (!borrowedByCurrency[currency]) {
          borrowedByCurrency[currency] = 0;
        }
        borrowedByCurrency[currency] += parseFloat(lb.amount) || 0;
      });
      
      // Total Assets Section - Enhanced with boxes
      doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
        .text('Total Assets', 50, doc.y);
      doc.moveDown(0.8);
      
      if (Object.keys(assetsByCurrency).length > 0) {
        Object.entries(assetsByCurrency).forEach(([currency, amount], index) => {
          const boxY = doc.y;
          const boxHeight = 45;
          
          // Draw box
          doc.rect(50, boxY, doc.page.width - 100, boxHeight)
            .fillColor('#f9fafb')
            .fill()
            .strokeColor('#e5e7eb')
            .lineWidth(1)
            .stroke();
          
          // Currency label - ensure proper encoding
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica')
            .text(String(`Total Assets (${currency})`), 60, boxY + 8);
          
          // Amount (large) - ensure proper encoding
          doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold')
            .text(String(formatCurrency(amount, currency)), 60, boxY + 20);
          
          // Account count - ensure proper encoding
          const accountCount = accountsByCurrency[currency];
          const accountText = `${accountCount} account${accountCount !== 1 ? 's' : ''}`;
          doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
            .text(String(accountText), 60, boxY + 38);
          
          doc.y = boxY + boxHeight + 10;
        });
      } else {
        doc.fillColor('#9ca3af').fontSize(11).font('Helvetica')
          .text('No accounts with balance', 70, doc.y);
        doc.moveDown(1.5);
      }
      
      doc.moveDown(1);
      
      // Account Summary - Enhanced
      doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
        .text('Account Summary', 50, doc.y);
      doc.moveDown(0.8);
      
      const totalAccounts = (data.accounts || []).length;
      const summaryBoxY = doc.y;
      const summaryBoxHeight = 50;
      
      doc.rect(50, summaryBoxY, doc.page.width - 100, summaryBoxHeight)
        .fillColor('#f9fafb')
        .fill()
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      
      doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
        .text('Total Accounts:', 60, summaryBoxY + 10);
      const totalAccountsText = `${totalAccounts} account${totalAccounts !== 1 ? 's' : ''}`;
      doc.fillColor('#374151').fontSize(12).font('Helvetica')
        .text(String(totalAccountsText), 180, summaryBoxY + 10);
      
      doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
        .text('Currencies:', 60, summaryBoxY + 28);
      const currenciesText = Object.keys(assetsByCurrency).length > 0 ? Object.keys(assetsByCurrency).join(', ') : 'N/A';
      doc.fillColor('#374151').fontSize(12).font('Helvetica')
        .text(String(currenciesText), 180, summaryBoxY + 28);
      
      doc.y = summaryBoxY + summaryBoxHeight + 15;
      
      // Lend/Borrow Summary - Enhanced
      doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
        .text('Lend/Borrow Summary', 50, doc.y);
      doc.moveDown(0.8);
      
      const lendBorrowBoxY = doc.y;
      let lendBorrowBoxHeight = 80;
      
      if (Object.keys(lentByCurrency).length === 0 && Object.keys(borrowedByCurrency).length === 0) {
        lendBorrowBoxHeight = 40;
      }
      
      doc.rect(50, lendBorrowBoxY, doc.page.width - 100, lendBorrowBoxHeight)
        .fillColor('#f9fafb')
        .fill()
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      
      let currentLendBorrowY = lendBorrowBoxY + 10;
      
      if (Object.keys(lentByCurrency).length > 0) {
        doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
          .text('Total Lent:', 60, currentLendBorrowY);
        Object.entries(lentByCurrency).forEach(([currency, amount]) => {
          const lentText = `${formatCurrency(amount, currency)} (${currency})`;
          doc.fillColor('#059669').fontSize(11).font('Helvetica')
            .text(String(lentText), 180, currentLendBorrowY);
          currentLendBorrowY += 16;
        });
      } else {
        doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
          .text('Total Lent:', 60, currentLendBorrowY);
        doc.fillColor('#9ca3af').fontSize(11).font('Helvetica')
          .text(String(formatCurrency(0, 'USD')), 180, currentLendBorrowY);
        currentLendBorrowY += 16;
      }
      
      if (Object.keys(borrowedByCurrency).length > 0) {
        doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
          .text('Total Borrowed:', 60, currentLendBorrowY);
        Object.entries(borrowedByCurrency).forEach(([currency, amount]) => {
          const borrowedText = `${formatCurrency(amount, currency)} (${currency})`;
          doc.fillColor('#dc2626').fontSize(11).font('Helvetica')
            .text(String(borrowedText), 180, currentLendBorrowY);
          currentLendBorrowY += 16;
        });
      } else {
        doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
          .text('Total Borrowed:', 60, currentLendBorrowY);
        doc.fillColor('#9ca3af').fontSize(11).font('Helvetica')
          .text(String(formatCurrency(0, 'USD')), 180, currentLendBorrowY);
        currentLendBorrowY += 16;
      }
      
      doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
        .text('Active Records:', 60, currentLendBorrowY);
      const activeRecordsText = `${activeLendBorrow.length} record${activeLendBorrow.length !== 1 ? 's' : ''}`;
      doc.fillColor('#374151').fontSize(11).font('Helvetica')
        .text(String(activeRecordsText), 180, currentLendBorrowY);
      
      doc.y = lendBorrowBoxY + lendBorrowBoxHeight + 15;
      
      // BANK ACCOUNTS SECTION (Grouped by Currency, Excluding Zero Balances)
      // accountsWithBalance already declared above for TOC
      
      if (accountsWithBalance.length > 0) {
        // Group accounts by currency
        const accountsByCurrency = {};
        accountsWithBalance.forEach(acc => {
          const currency = acc.currency || 'USD';
          if (!accountsByCurrency[currency]) {
            accountsByCurrency[currency] = [];
          }
          accountsByCurrency[currency].push(acc);
        });
        
        // Create a page for each currency (only if there are accounts for that currency)
        const currencies = Object.keys(accountsByCurrency).sort().filter(currency => accountsByCurrency[currency].length > 0);
        if (currencies.length > 0) {
          currencies.forEach((currency, currencyIndex) => {
          if (currencyIndex > 0) {
            currentPageNum = addPageWithHeader();
          } else {
            currentPageNum = addPageWithHeader();
          }
          pageNumbers.set(`accounts-${currency}`, currentPageNum);
          
          doc.fillColor('#f9fafb').fontSize(18).font('Helvetica-Bold')
            .text(`Accounts - ${currency}`, 50, 80);
          doc.moveDown(1);
          
          const accountRows = accountsByCurrency[currency].map(acc => [
            acc.name || 'Unnamed Account',
            acc.type || 'N/A',
            formatCurrency(parseFloat(acc.calculated_balance) || 0, currency),
            acc.account_number || 'N/A',
            acc.institution || 'N/A',
            (acc.description || '').substring(0, 50) || 'N/A'
          ]);
          
          if (accountRows.length > 0) {
            drawTable(
              ['Account Name', 'Type', 'Balance', 'Account Number', 'Institution', 'Description'],
              accountRows,
              doc.y,
              {
                columnWidths: [
                  (doc.page.width - 100) * 0.22,
                  (doc.page.width - 100) * 0.12,
                  (doc.page.width - 100) * 0.15,
                  (doc.page.width - 100) * 0.12,
                  (doc.page.width - 100) * 0.15,
                  (doc.page.width - 100) * 0.24
                ]
              }
            );
          }
          });
        }
      }

      // INVESTMENT ASSETS SECTION
      if (investmentAssets.length > 0) {
        currentPageNum = addPageWithHeader();
        pageNumbers.set('investmentAssets', currentPageNum);
        
        doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold')
          .text('Investment Assets', 50, 80);
        doc.moveDown(1);
        
        const investmentRows = investmentAssets.map(asset => [
          asset.name || 'N/A',
          asset.type || 'N/A',
          formatCurrency(parseFloat(asset.current_value || asset.total_value || 0), asset.currency || 'USD'),
          asset.currency || 'USD',
          asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A',
          asset.quantity ? String(asset.quantity) : 'N/A',
          (asset.notes || '').substring(0, 35) || 'N/A'
        ]);
        
        drawTable(
          ['Name', 'Type', 'Current Value', 'Currency', 'Purchase Date', 'Quantity', 'Notes'],
          investmentRows,
          doc.y,
          {
            columnWidths: [
              (doc.page.width - 100) * 0.20,
              (doc.page.width - 100) * 0.12,
              (doc.page.width - 100) * 0.15,
              (doc.page.width - 100) * 0.10,
              (doc.page.width - 100) * 0.13,
              (doc.page.width - 100) * 0.10,
              (doc.page.width - 100) * 0.20
            ],
            fontSize: 8
          }
        );
      }
      
      // SAVINGS & DONATION RECORDS SECTION
      if (savingsRecords.length > 0) {
        currentPageNum = addPageWithHeader();
        pageNumbers.set('savingsRecords', currentPageNum);
        
        doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold')
          .text('Savings & Donation Records', 50, 80);
        doc.moveDown(1);
        
        const savingsRows = savingsRecords.map(ds => [
          ds.type || 'N/A',
          ds.name || 'N/A',
          formatCurrency(parseFloat(ds.target_amount) || 0, ds.currency || 'USD'),
          formatCurrency(parseFloat(ds.current_amount) || 0, ds.currency || 'USD'),
          ds.currency || 'USD',
          ds.status || 'N/A',
          ds.target_date ? formatDate(ds.target_date) : 'N/A',
          (ds.notes || '').substring(0, 30) || 'N/A'
        ]);
        
        drawTable(
          ['Type', 'Name', 'Target Amount', 'Current Amount', 'Currency', 'Status', 'Target Date', 'Notes'],
          savingsRows,
          doc.y,
          {
            columnWidths: [
              (doc.page.width - 100) * 0.10,
              (doc.page.width - 100) * 0.18,
              (doc.page.width - 100) * 0.12,
              (doc.page.width - 100) * 0.12,
              (doc.page.width - 100) * 0.10,
              (doc.page.width - 100) * 0.10,
              (doc.page.width - 100) * 0.13,
              (doc.page.width - 100) * 0.15
            ],
            fontSize: 7
          }
        );
      }
      
      // LEND/BORROW SECTION (Only Active/Unsettled Records)
      if (activeLendBorrow.length > 0) {
        currentPageNum = addPageWithHeader();
        pageNumbers.set('lendBorrow', currentPageNum);
        
        doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold')
          .text('Lend/Borrow Records', 50, 80);
        doc.moveDown(1);
        
        const lendBorrowRows = activeLendBorrow.map(lb => {
          const type = lb.type === 'lent' || lb.type === 'lend' ? 'Lent' : 
                       lb.type === 'borrowed' || lb.type === 'borrow' ? 'Borrowed' : 
                       lb.type || 'N/A';
          return [
            type,
            lb.person_name || lb.person || lb.entity || 'N/A',
            formatCurrency(parseFloat(lb.amount) || 0, lb.currency || 'USD'),
            lb.currency || 'USD',
            lb.due_date ? formatDate(lb.due_date) : 'N/A',
            (lb.notes || '').substring(0, 40)
          ];
        });
        
        drawTable(
          ['Type', 'Person/Entity', 'Amount', 'Currency', 'Due Date', 'Notes'],
          lendBorrowRows,
          doc.y,
          {
            columnWidths: [
              (doc.page.width - 100) * 0.12,
              (doc.page.width - 100) * 0.22,
              (doc.page.width - 100) * 0.18,
              (doc.page.width - 100) * 0.12,
              (doc.page.width - 100) * 0.15,
              (doc.page.width - 100) * 0.21
            ],
            fontSize: 8
          }
        );
      }
      
      // Get final page count - use bufferedPageRange() for final accurate count
      const range = doc.bufferedPageRange();
      const finalTotalPages = range.count || totalPages;
      
      // Note: PDFKit doesn't allow easy modification of existing pages
      // The addHeaderFooter function uses bufferedPageRange().count which becomes
      // more accurate as pages are added. The last page will have the correct total.
      // For earlier pages, the count may be approximate but will be close.
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function sendDataToRecipient(user, recipient, userData, settings, isTestMode = false) {
  const TARGET_USER_ID = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
  const isTargetUser = user.id === TARGET_USER_ID;
  
  const metadata = {
    userId: user.id,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    isTestMode
  };

  if (isTargetUser) {
    console.log(`[SEND-DATA-TO-RECIPIENT] 🎯 Starting for target user, recipient: ${recipient.name} (${recipient.email})`);
  }

  // Validate recipient email before attempting to send
  const emailValidation = validateEmail(recipient.email);
  if (!emailValidation.valid) {
    if (isTargetUser) {
      console.error(`[SEND-DATA-TO-RECIPIENT] ❌ Email validation failed: ${emailValidation.error}`);
    }
    await logError('sendDataToRecipient', new Error(emailValidation.error), {
      ...metadata,
      validationError: true
    });
    return { success: false, error: emailValidation.error, validationError: true };
  }

  if (isTargetUser) {
    console.log(`[SEND-DATA-TO-RECIPIENT] ✅ Email validated successfully`);
  }

  // Use retry mechanism for sending email
  return await retryWithBackoff(
    async () => {
  try {
    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] Filtering data based on settings...`);
    }
    
    // Filter data based on user preferences
    const filteredData = filterDataBySettings(userData, settings.include_data);

    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] Creating email content...`);
    }

    // Create email content
    const emailContent = createEmailContent(user, recipient, filteredData, settings, isTestMode);

    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] Generating PDF...`);
    }

    // Generate PDF
    const pdfBuffer = await createPDFBuffer(user, recipient, filteredData, settings);

    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] PDF generated, size: ${pdfBuffer.length} bytes`);
    }

    // Get user's display name for subject
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || user.email;

    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] Preparing email:`, {
        from: process.env.SMTP_USER,
        to: recipient.email,
        subject: `${isTestMode ? '🧪 Test - ' : ''}Last Wish Delivery from ${userName}`,
        hasPDF: !!pdfBuffer,
        pdfSize: pdfBuffer?.length || 0
      });
    }

    // Send email
    const mailOptions = {
      from: `Balanze <${process.env.SMTP_USER}>`,
      to: recipient.email,
      subject: `${isTestMode ? '🧪 Test - ' : ''}Last Wish Delivery from ${userName}`,
      html: emailContent,
      attachments: [
        {
          filename: `${isTestMode ? 'test-' : ''}financial-data-backup.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] 📤 Sending email via SMTP...`);
    }

    const result = await transporter.sendMail(mailOptions);

    if (isTargetUser) {
      console.log(`[SEND-DATA-TO-RECIPIENT] ✅ Email sent successfully!`, {
        messageId: result.messageId,
        response: result.response
      });
    }

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
  const TARGET_USER_ID = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
  const isTargetUser = userId === TARGET_USER_ID;

  if (isTargetUser) {
    console.log(`[SEND-LAST-WISH-EMAIL] 🎯 STARTING for target user: ${userId}`);
    console.log(`[SEND-LAST-WISH-EMAIL] Test mode: ${testMode}`);
  }

  try {
    // Check if SMTP is configured
    if (!transporter) {
      const error = new Error('SMTP not configured. Please set up SMTP settings in environment variables.');
      if (isTargetUser) {
        console.error(`[SEND-LAST-WISH-EMAIL] ❌ SMTP not configured!`);
        console.error(`[SEND-LAST-WISH-EMAIL] SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
        console.error(`[SEND-LAST-WISH-EMAIL] SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'NOT SET'}`);
        console.error(`[SEND-LAST-WISH-EMAIL] SMTP_PASS: ${process.env.SMTP_PASS ? 'SET' : 'NOT SET'}`);
      }
      await logError('sendLastWishEmail', error, { ...metadata, smtpCheck: true });
      throw error;
    }

    if (isTargetUser) {
      console.log(`[SEND-LAST-WISH-EMAIL] ✅ SMTP transporter is configured`);
    }

    // Get user's Last Wish settings with retry
    if (isTargetUser) {
      console.log(`[SEND-LAST-WISH-EMAIL] Fetching settings for target user...`);
    }
    
    // First, atomically mark as triggered to prevent duplicate sends
    // This must happen BEFORE fetching settings to prevent race conditions
    const { data: lockData, error: lockError } = await supabase
      .from('last_wish_settings')
      .update({ 
        delivery_triggered: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('delivery_triggered', false) // Only update if not already triggered
      .select();
    
    if (lockError) {
      await logError('sendLastWishEmail', lockError, { ...metadata, operation: 'lockSettings' });
      throw new Error(`Failed to lock settings: ${lockError.message}`);
    }
    
    // If no rows were updated, it means delivery_triggered was already true
    if (!lockData || lockData.length === 0) {
      if (isTargetUser) {
        console.log(`[SEND-LAST-WISH-EMAIL] ⚠️ Settings already marked as triggered, skipping to prevent duplicates`);
      }
      return {
        success: false,
        message: 'Last Wish delivery already triggered for this user',
        skipped: true
      };
    }
    
    const settings = await retryWithBackoff(
      async () => {
        const { data, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

        if (settingsError || !data) {
          if (isTargetUser) {
            console.error(`[SEND-LAST-WISH-EMAIL] ❌ Settings not found. Error:`, settingsError);
          }
      throw new Error('Last Wish settings not found');
    }
        
        if (isTargetUser) {
          console.log(`[SEND-LAST-WISH-EMAIL] ✅ Settings found:`, {
            is_enabled: data.is_enabled,
            is_active: data.is_active,
            delivery_triggered: data.delivery_triggered,
            recipient_count: data.recipients?.length || 0,
            check_in_frequency: data.check_in_frequency,
            last_check_in: data.last_check_in
          });
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
    if (isTargetUser) {
      console.log(`[SEND-LAST-WISH-EMAIL] Gathering user data...`);
    }
    
    let userData;
    try {
      userData = await gatherUserData(userId);
      
      if (isTargetUser) {
        console.log(`[SEND-LAST-WISH-EMAIL] ✅ User data gathered:`, {
          accounts: userData.accounts?.length || 0,
          transactions: userData.transactions?.length || 0,
          purchases: userData.purchases?.length || 0,
          lendBorrow: userData.lendBorrow?.length || 0,
          savings: userData.donationSavings?.length || 0
        });
      }
    } catch (dataError) {
      if (isTargetUser) {
        console.error(`[SEND-LAST-WISH-EMAIL] ❌ Failed to gather user data:`, dataError);
      }
      await logError('sendLastWishEmail', dataError, {
        ...metadata,
        operation: 'gatherUserData'
      });
      throw new Error(`Failed to gather user data: ${dataError.message}`);
    }

    // Send emails to all valid recipients
    const results = [];
    if (isTargetUser) {
      console.log(`[SEND-LAST-WISH-EMAIL] Starting to send emails to ${recipientsToSend.length} recipient(s)...`);
    }

    for (const recipient of recipientsToSend) {
      if (isTargetUser) {
        console.log(`[SEND-LAST-WISH-EMAIL] 📧 Sending email to: ${recipient.name} (${recipient.email})`);
      }
      
      try {
      const result = await sendDataToRecipient(user.user, recipient, userData, settings, testMode);
      
      if (isTargetUser) {
        console.log(`[SEND-LAST-WISH-EMAIL] Email result for ${recipient.email}:`, {
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });
      }
      
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

    // Mark as inactive (delivery_triggered was already set at the start to prevent duplicates)
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
      } else {
        // If all emails failed, reset delivery_triggered to allow retry
        try {
          await supabase
            .from('last_wish_settings')
            .update({ 
              delivery_triggered: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        } catch (resetError) {
          await logError('sendLastWishEmail', resetError, {
            ...metadata,
            operation: 'resetDeliveryTriggered'
          });
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
