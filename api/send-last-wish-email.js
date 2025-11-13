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
