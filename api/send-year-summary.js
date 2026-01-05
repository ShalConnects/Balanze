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

/**
 * Gather user financial data for a specific year
 * @param {string} userId - User ID
 * @param {number} year - Year to gather data for
 * @returns {Promise<object>} - User financial data for the year
 */
export async function gatherYearData(userId, year) {
  const data = {};
  const startDate = new Date(year, 0, 1).toISOString();
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

  try {
    // Gather accounts (current state)
    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      
      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
      }
      data.accounts = accounts || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      data.accounts = [];
    }

    // Gather transactions for the year
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      }
      data.transactions = transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      data.transactions = [];
    }

    // Gather purchases for the year
    try {
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
      }
      data.purchases = purchases || [];
    } catch (error) {
      console.error('Error fetching purchases:', error);
      data.purchases = [];
    }

    // Gather lend/borrow records (active during the year)
    try {
      const { data: lendBorrow, error: lendBorrowError } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('user_id', userId);
      
      if (lendBorrowError) {
        console.error('Error fetching lend_borrow:', lendBorrowError);
      }
      // Filter to records active during the year
      data.lendBorrow = (lendBorrow || []).filter(lb => {
        const createdDate = new Date(lb.created_at || lb.date);
        return createdDate.getFullYear() === year || lb.status === 'active';
      });
    } catch (error) {
      console.error('Error fetching lend_borrow:', error);
      data.lendBorrow = [];
    }

    return data;
  } catch (error) {
    console.error('Error gathering year data:', error);
    throw error;
  }
}

/**
 * Calculate year summary metrics
 * @param {object} data - User financial data
 * @param {number} year - Year
 * @returns {object} - Calculated metrics
 */
function calculateYearMetrics(data, year) {
  const transactions = data.transactions || [];
  const accounts = data.accounts || [];
  
  // Filter out transfer transactions
  const nonTransferTransactions = transactions.filter(t => {
    const tags = t.tags || [];
    return !tags.some(tag => tag.includes('transfer') || tag.includes('dps_transfer'));
  });
  
  const incomeTransactions = nonTransferTransactions.filter(t => t.type === 'income');
  const expenseTransactions = nonTransferTransactions.filter(t => t.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
  const netAmount = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netAmount / totalIncome) * 100 : 0;
  
  // Monthly breakdown
  const monthlyBreakdown = {};
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    const monthTransactions = nonTransferTransactions.filter(t => {
      const tDate = new Date(t.date || t.created_at);
      return tDate >= monthStart && tDate <= monthEnd;
    });
    
    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const monthExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
    
    monthlyBreakdown[month] = {
      income: monthIncome,
      expenses: monthExpenses,
      net: monthIncome - monthExpenses,
      transactionCount: monthTransactions.length
    };
  }
  
  // Category breakdown
  const categoryBreakdown = {};
  expenseTransactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(parseFloat(t.amount) || 0);
  });
  
  // Get primary currency
  const primaryCurrency = accounts.length > 0 ? (accounts[0].currency || 'USD') : 'USD';
  
  // Total account balance (current)
  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance || acc.calculated_balance) || 0), 0);
  
  return {
    year,
    totalIncome,
    totalExpenses,
    netAmount,
    savingsRate,
    monthlyBreakdown,
    categoryBreakdown,
    primaryCurrency,
    totalBalance,
    transactionCount: nonTransferTransactions.length,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length
  };
}

/**
 * Generate year summary PDF
 * @param {object} user - User object
 * @param {object} data - User financial data
 * @param {object} metrics - Calculated metrics
 * @returns {Promise<Buffer>} - PDF buffer
 */
export function createYearSummaryPDF(user, data, metrics) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'LETTER',
        info: {
          Title: `Year ${metrics.year} Financial Summary`,
          Author: 'Balanze',
          Subject: `Financial Summary for ${metrics.year}`,
          Keywords: `Year Summary, Financial Report, ${metrics.year}`,
          Creator: 'Balanze',
          Producer: 'Balanze'
        }
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // Helper functions
      const formatCurrency = (amount, currency = metrics.primaryCurrency) => {
        const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$' };
        const symbol = symbols[currency] || currency;
        return `${symbol}${Math.abs(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };
      
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      
      // Title page
      doc.fontSize(24).fillColor('#1f2937').text(`Year ${metrics.year} Financial Summary`, 50, 100, { align: 'center' });
      doc.fontSize(16).fillColor('#6b7280').text(`For ${userName}`, 50, 140, { align: 'center' });
      doc.fontSize(12).fillColor('#9ca3af').text(`Generated: ${new Date().toLocaleDateString()}`, 50, 170, { align: 'center' });
      
      doc.moveDown(3);
      
      // Summary section
      doc.fontSize(18).fillColor('#1f2937').text('Financial Overview', 50, doc.y);
      doc.moveDown(0.5);
      
      doc.fontSize(12).fillColor('#374151');
      doc.text(`Total Income: ${formatCurrency(metrics.totalIncome)}`, 50, doc.y);
      doc.text(`Total Expenses: ${formatCurrency(metrics.totalExpenses)}`, 50, doc.y);
      doc.text(`Net Amount: ${formatCurrency(metrics.netAmount)}`, 50, doc.y);
      doc.text(`Savings Rate: ${metrics.savingsRate.toFixed(1)}%`, 50, doc.y);
      doc.text(`Total Balance: ${formatCurrency(metrics.totalBalance)}`, 50, doc.y);
      doc.text(`Transactions: ${metrics.transactionCount}`, 50, doc.y);
      
      doc.moveDown(1);
      
      // Monthly breakdown
      doc.fontSize(18).fillColor('#1f2937').text('Monthly Breakdown', 50, doc.y);
      doc.moveDown(0.5);
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      doc.fontSize(10).fillColor('#374151');
      for (let month = 0; month < 12; month++) {
        const monthData = metrics.monthlyBreakdown[month];
        doc.text(`${monthNames[month]}:`, 50, doc.y);
        doc.text(`  Income: ${formatCurrency(monthData.income)}`, 70, doc.y);
        doc.text(`  Expenses: ${formatCurrency(monthData.expenses)}`, 70, doc.y);
        doc.text(`  Net: ${formatCurrency(monthData.net)}`, 70, doc.y);
        doc.text(`  Transactions: ${monthData.transactionCount}`, 70, doc.y);
        doc.moveDown(0.3);
      }
      
      doc.moveDown(1);
      
      // Top categories
      doc.fontSize(18).fillColor('#1f2937').text('Top Spending Categories', 50, doc.y);
      doc.moveDown(0.5);
      
      const sortedCategories = Object.entries(metrics.categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      doc.fontSize(10).fillColor('#374151');
      sortedCategories.forEach(([category, amount]) => {
        doc.text(`${category}: ${formatCurrency(amount)}`, 50, doc.y);
        doc.moveDown(0.2);
      });
      
      // Footer
      doc.fontSize(8).fillColor('#9ca3af');
      doc.text(
        `Generated by Balanze | ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create year summary email content
 * @param {object} user - User object
 * @param {object} metrics - Calculated metrics
 * @returns {string} - HTML email content
 */
function createYearSummaryEmail(user, metrics) {
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const formatCurrency = (amount) => {
    const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$' };
    const symbol = symbols[metrics.primaryCurrency] || metrics.primaryCurrency;
    return `${symbol}${Math.abs(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${metrics.year} Year in Review</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Your ${metrics.year} Year in Review</h1>
      <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">A complete financial summary of your year</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        As we wrap up ${metrics.year}, here's a comprehensive look at your financial journey this year!
      </p>
      
      <!-- Summary Cards -->
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin: 30px 0;">
        <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">Financial Highlights</h2>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Total Income</p>
          <p style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(metrics.totalIncome)}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Total Expenses</p>
          <p style="color: #ef4444; font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(metrics.totalExpenses)}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Net Amount</p>
          <p style="color: ${metrics.netAmount >= 0 ? '#10b981' : '#ef4444'}; font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(metrics.netAmount)}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Savings Rate</p>
          <p style="color: #3b82f6; font-size: 24px; font-weight: 700; margin: 0;">${metrics.savingsRate.toFixed(1)}%</p>
        </div>
        
        <div>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Total Transactions</p>
          <p style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">${metrics.transactionCount}</p>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        A detailed PDF report is attached with monthly breakdowns, category analysis, and more insights.
      </p>
      
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        Thank you for using Balanze to manage your finances. We're here to help you achieve your financial goals in ${metrics.year + 1}!
      </p>
      
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        Best regards,<br>
        The Balanze Team
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        This is an automated email from Balanze. If you have any questions, please contact support.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send year summary email to a user
 * @param {object} user - User object
 * @param {number} year - Year
 * @returns {Promise<object>} - Result
 */
export async function sendYearSummaryToUser(user, year) {
  try {
    if (!transporter) {
      throw new Error('SMTP not configured');
    }
    
    // Gather year data
    const data = await gatherYearData(user.id, year);
    
    // Calculate metrics
    const metrics = calculateYearMetrics(data, year);
    
    // Generate PDF
    const pdfBuffer = await createYearSummaryPDF(user, data, metrics);
    
    // Create email content
    const emailContent = createYearSummaryEmail(user, metrics);
    
    // Get user email
    const userEmail = user.email;
    if (!userEmail) {
      throw new Error('User email not found');
    }
    
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    
    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `🎉 Your ${year} Year in Review - Balanze`,
      html: emailContent,
      attachments: [
        {
          filename: `year-summary-${year}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: result.messageId, userId: user.id };
  } catch (error) {
    console.error(`Error sending year summary to user ${user.id}:`, error);
    return { success: false, error: error.message, userId: user.id };
  }
}

/**
 * Send year summaries to all users in batches
 * @param {number} year - Year (defaults to previous year)
 * @param {number} batchSize - Number of users to process per batch (default: 10)
 * @returns {Promise<object>} - Summary of results
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check for authorization (simple API key check)
  const apiKey = req.headers['x-api-key'] || req.body?.apiKey;
  const expectedKey = process.env.YEAR_SUMMARY_API_KEY || 'your-secret-key-change-this';
  
  if (apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const year = req.body?.year || new Date().getFullYear() - 1;
    const batchSize = req.body?.batchSize || 10;
    
    console.log(`Starting year summary email campaign for year ${year}...`);
    
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    
    if (!users || users.users.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No users found',
        stats: { total: 0, sent: 0, failed: 0 }
      });
    }
    
    console.log(`Found ${users.users.length} users. Processing in batches of ${batchSize}...`);
    
    const results = {
      total: users.users.length,
      sent: 0,
      failed: 0,
      errors: []
    };
    
    // Process in batches
    for (let i = 0; i < users.users.length; i += batchSize) {
      const batch = users.users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (users ${i + 1}-${Math.min(i + batchSize, users.users.length)})...`);
      
      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(user => sendYearSummaryToUser(user, year))
      );
      
      // Count results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.sent++;
        } else {
          results.failed++;
          const error = result.status === 'fulfilled' 
            ? result.value.error 
            : result.reason?.message || 'Unknown error';
          results.errors.push({
            userId: batch[index].id,
            email: batch[index].email,
            error
          });
        }
      });
      
      console.log(`Batch complete. Progress: ${results.sent} sent, ${results.failed} failed`);
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < users.users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Year summary campaign complete! Sent: ${results.sent}, Failed: ${results.failed}`);
    
    return res.status(200).json({
      success: true,
      message: `Year summary campaign completed for ${year}`,
      year,
      stats: results
    });
    
  } catch (error) {
    console.error('Error in year summary handler:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

