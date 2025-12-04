/**
 * Last Wish Email Delivery Test Script
 * 
 * This script demonstrates the Last Wish email delivery functionality
 * when a user becomes overdue in test mode.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with actual test user ID)
const TEST_USER_ID = 'your-test-user-id';

/**
 * Simulate Last Wish email delivery
 */
async function simulateLastWishDelivery() {
  console.log('📧 Simulating Last Wish Email Delivery...\n');
  
  try {
    // Get user's Last Wish settings
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();
    
    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return;
    }
    
    if (!settings || !settings.recipients || settings.recipients.length === 0) {
      console.log('⚠️  No recipients configured for Last Wish delivery');
      return;
    }
    
    console.log('📋 Last Wish Settings:');
    console.log(`   - Recipients: ${settings.recipients.length}`);
    console.log(`   - Test Mode: ${settings.check_in_frequency <= 60 ? 'Yes' : 'No'}`);
    console.log(`   - Check-in Frequency: ${settings.check_in_frequency} ${settings.check_in_frequency <= 60 ? 'minutes' : 'days'}`);
    console.log(`   - Personal Message: ${settings.message ? 'Yes' : 'No'}`);
    console.log(`   - Data to Include:`, settings.include_data);
    console.log('');
    
    // Gather user data
    const userData = await gatherUserData(TEST_USER_ID);
    
    // Create email content
    const emailContent = createLastWishEmail(userData, settings);
    
    // Simulate sending emails to recipients
    console.log('📤 Sending emails to recipients:');
    for (const recipient of settings.recipients) {
      console.log(`   📧 Sending to: ${recipient.email} (${recipient.name})`);
      console.log(`      Relationship: ${recipient.relationship}`);
      
      // In a real implementation, this would send the actual email
      console.log(`      ✅ Email sent successfully`);
    }
    
    console.log('\n📄 Email Content Preview:');
    console.log('=' .repeat(60));
    console.log(emailContent);
    console.log('=' .repeat(60));
    
    // Mark as delivered
    const { error: updateError } = await supabase
      .from('last_wish_settings')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', TEST_USER_ID);
    
    if (updateError) {
      console.error('❌ Error updating delivery status:', updateError);
    } else {
      console.log('\n✅ Last Wish delivery completed successfully!');
      console.log('   - Status: Delivered');
      console.log('   - Recipients notified: ' + settings.recipients.length);
      console.log('   - System marked as inactive to prevent duplicate deliveries');
    }
    
  } catch (error) {
    console.error('❌ Error in Last Wish delivery simulation:', error);
  }
}

/**
 * Gather user's financial data
 */
async function gatherUserData(userId) {
  console.log('📊 Gathering user financial data...');
  
  const data = {};
  
  try {
    // Gather accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    data.accounts = accounts || [];
    console.log(`   - Accounts: ${data.accounts.length}`);
    
    // Gather transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    data.transactions = transactions || [];
    console.log(`   - Transactions: ${data.transactions.length}`);
    
    // Gather purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId);
    data.purchases = purchases || [];
    console.log(`   - Purchases: ${data.purchases.length}`);
    
    // Gather lend/borrow records
    const { data: lendBorrow } = await supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', userId);
    data.lendBorrow = lendBorrow || [];
    console.log(`   - Lend/Borrow Records: ${data.lendBorrow.length}`);
    
    // Gather donation/savings records
    const { data: donationSavings } = await supabase
      .from('donation_saving_records')
      .select('*')
      .eq('user_id', userId);
    data.donationSavings = donationSavings || [];
    console.log(`   - Savings Records: ${data.donationSavings.length}`);
    
  } catch (error) {
    console.error('❌ Error gathering user data:', error);
  }
  
  return data;
}

/**
 * Create Last Wish email content
 */
function createLastWishEmail(userData, settings) {
  const userName = 'Test User'; // In real implementation, get from user profile
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
          <p>This data has been automatically delivered because ${userName} has not checked in with their financial management system for an extended period.</p>
        </div>

        ${settings.message ? `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3>Personal Message from ${userName}:</h3>
            <div>${settings.message}</div>
          </div>
        ` : ''}

        <div class="data-summary">
          <h3>Financial Data Summary:</h3>
          <ul>
            ${userData.accounts.length > 0 ? `<li>Accounts: ${userData.accounts.length}</li>` : ''}
            ${userData.transactions.length > 0 ? `<li>Transactions: ${userData.transactions.length}</li>` : ''}
            ${userData.purchases.length > 0 ? `<li>Purchases: ${userData.purchases.length}</li>` : ''}
            ${userData.lendBorrow.length > 0 ? `<li>Lend/Borrow Records: ${userData.lendBorrow.length}</li>` : ''}
            ${userData.donationSavings.length > 0 ? `<li>Savings Records: ${userData.donationSavings.length}</li>` : ''}
          </ul>
        </div>

        <p>A detailed JSON file containing all the financial data has been attached to this email.</p>

        <div class="footer">
          <p>This is an automated delivery from the Last Wish system. Please handle this information with care and respect for ${userName}'s privacy.</p>
          <p>Delivery Date: ${currentDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Test the complete Last Wish workflow
 */
async function testLastWishWorkflow() {
  console.log('🚀 Testing Complete Last Wish Workflow\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Set up test mode with 5-minute frequency
    console.log('1️⃣ Setting up test mode...');
    const { error: setupError } = await supabase
      .from('last_wish_settings')
      .upsert({
        user_id: TEST_USER_ID,
        is_enabled: true,
        check_in_frequency: 5, // 5 minutes for test mode
        last_check_in: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago (overdue)
        recipients: [
          {
            id: '1',
            email: 'test1@example.com',
            name: 'Test Recipient 1',
            relationship: 'Family'
          },
          {
            id: '2',
            email: 'test2@example.com',
            name: 'Test Recipient 2',
            relationship: 'Friend'
          }
        ],
        include_data: {
          accounts: true,
          transactions: true,
          purchases: true,
          lendBorrow: true,
          savings: true,
          analytics: true
        },
        message: 'This is a test message for the Last Wish system. Please handle my financial data with care.',
        is_active: true,
        updated_at: new Date().toISOString()
      });
    
    if (setupError) {
      console.error('❌ Error setting up test mode:', setupError);
      return;
    }
    
    console.log('✅ Test mode set up successfully');
    console.log('   - Frequency: 5 minutes');
    console.log('   - Last check-in: 6 minutes ago (OVERDUE)');
    console.log('   - Recipients: 2');
    console.log('');
    
    // Step 2: Simulate delivery
    console.log('2️⃣ Simulating Last Wish delivery...');
    await simulateLastWishDelivery();
    
    console.log('\n🎉 Last Wish workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in Last Wish workflow test:', error);
  }
}

// Export functions for individual testing
export {
  simulateLastWishDelivery,
  gatherUserData,
  createLastWishEmail,
  testLastWishWorkflow
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testLastWishWorkflow();
}
