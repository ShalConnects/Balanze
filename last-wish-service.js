import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Email transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

class LastWishService {
  constructor() {
    this.logFile = path.join(__dirname, 'last-wish-logs.txt');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(this.logFile, logMessage);
  }

  async checkOverdueUsers() {
    try {
      this.log('Checking for overdue Last Wish users...');
      
      // Try the RPC function first
      let overdueUsers = [];
      let error = null;
      
      try {
        const { data, error: rpcError } = await supabase
          .rpc('check_overdue_last_wish');
        
        if (rpcError) {
          throw rpcError;
        }
        
        // Handle both table and JSON return types
        if (Array.isArray(data)) {
          overdueUsers = data;
        } else if (typeof data === 'object' && data !== null) {
          // If it's a JSON object, it might be a single result
          overdueUsers = [data];
        } else if (Array.isArray(data)) {
          overdueUsers = data;
        } else {
          this.log('Unexpected data format from RPC function');
          overdueUsers = [];
        }
      } catch (rpcError) {
        this.log(`RPC function failed, trying direct query: ${rpcError.message}`);
        
        // Fallback to direct query
        const { data: directData, error: directError } = await supabase
          .from('last_wish_settings')
          .select(`
            user_id,
            check_in_frequency,
            last_check_in
          `)
          .eq('is_enabled', true)
          .eq('is_active', true)
          .not('last_check_in', 'is', null);
        
        if (directError) {
          throw directError;
        }
        
        // Calculate overdue users manually
        overdueUsers = directData
          .filter(record => {
            const lastCheckIn = new Date(record.last_check_in);
            const nextCheckIn = new Date(lastCheckIn.getTime() + (record.check_in_frequency * 24 * 60 * 60 * 1000));
            const now = new Date();
            return now > nextCheckIn;
          })
          .map(record => ({
            user_id: record.user_id,
            email: 'unknown@example.com', // We'll need to get email separately if needed
            days_overdue: Math.floor((new Date() - new Date(record.last_check_in + (record.check_in_frequency * 24 * 60 * 60 * 1000))) / (1000 * 60 * 60 * 24))
          }));
      }

      this.log(`Found ${overdueUsers.length} overdue users`);

      for (const user of overdueUsers) {
        await this.processOverdueUser(user);
      }

      return overdueUsers.length;
    } catch (error) {
      this.log(`Error checking overdue users: ${error.message}`);
      throw error;
    }
  }

  async processOverdueUser(user) {
    try {
      this.log(`Processing overdue user: ${user.email} (${user.days_overdue} days overdue)`);

      // Get user's complete data
      const userData = await this.gatherUserData(user.user_id);
      
      // Get delivery settings
      const { data: settings, error: settingsError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (settingsError) {
        throw settingsError;
      }

      // Send data to each recipient
      for (const recipient of settings.recipients) {
        await this.sendDataToRecipient(user, recipient, userData, settings);
      }

      // Mark as delivered
      await supabase
        .from('last_wish_settings')
        .update({ is_active: false })
        .eq('user_id', user.user_id);

      this.log(`Successfully processed user: ${user.email}`);
    } catch (error) {
      this.log(`Error processing user ${user.email}: ${error.message}`);
    }
  }

  async gatherUserData(userId) {
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

  async sendDataToRecipient(user, recipient, userData, settings) {
    try {
      // Filter data based on user preferences
      const filteredData = this.filterDataBySettings(userData, settings.include_data);

      // Create email content
      const emailContent = this.createEmailContent(user, recipient, filteredData, settings);

      // Send email
      const mailOptions = {
        from: SMTP_USER,
        to: recipient.email,
        subject: `Important: Financial Data from ${user.email}`,
        html: emailContent,
        attachments: [
          {
            filename: 'financial-data.json',
            content: JSON.stringify(filteredData, null, 2),
            contentType: 'application/json'
          }
        ]
      };

      await transporter.sendMail(mailOptions);

      // Update delivery status
      await supabase
        .from('last_wish_deliveries')
        .update({ 
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id)
        .eq('recipient_email', recipient.email);

      this.log(`Sent data to recipient: ${recipient.email}`);
    } catch (error) {
      this.log(`Error sending to ${recipient.email}: ${error.message}`);
      
      // Update delivery status to failed
      await supabase
        .from('last_wish_deliveries')
        .update({ 
          delivery_status: 'failed',
          error_message: error.message
        })
        .eq('user_id', user.user_id)
        .eq('recipient_email', recipient.email);
    }
  }

  filterDataBySettings(userData, includeSettings) {
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

  createEmailContent(user, recipient, data, settings) {
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
        <title>Important: Financial Data</title>
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
            <h2>Important: Financial Data Delivery</h2>
            <p>This email contains important financial data that was requested to be delivered to you.</p>
          </div>

          <div class="warning">
            <strong>⚠️ Important Notice:</strong>
            <p>This data has been automatically delivered because the account owner (${user.email}) has not checked in with their financial management system for an extended period.</p>
          </div>

          ${settings.message ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3>Personal Message:</h3>
              <p>${settings.message}</p>
            </div>
          ` : ''}

          <div class="data-summary">
            <h3>Data Summary:</h3>
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
            <p>This is an automated delivery from the Last Wish system. Please handle this information with care and respect for the account owner's privacy.</p>
            <p>Delivery Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async run() {
    try {
      this.log('Starting Last Wish service...');
      const processedCount = await this.checkOverdueUsers();
      this.log(`Service completed. Processed ${processedCount} users.`);
    } catch (error) {
      this.log(`Service failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the service
if (import.meta.url === path.toFileURL(process.argv[1]).href) {
  const service = new LastWishService();
  service.run();
}

export default LastWishService; 