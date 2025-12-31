/**
 * Comprehensive test script for Last Wish email and PDF generation
 * Tests the new email template and PDF with financial summary
 * Run: node test-email-and-pdf-generation.js
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const USER_ID = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
const USER_EMAIL = 'salauddin.kader406@gmail.com';

// Use credentials from codebase
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

// Try to get service key from env, fallback to anon key
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabaseKeyToUse = serviceKey || supabaseAnonKey;

// Set environment variables before importing the email handler
process.env.VITE_SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_SERVICE_KEY = supabaseKeyToUse;

// Create supabase client
const supabase = createClient(supabaseUrl, supabaseKeyToUse);

if (serviceKey) {
  console.log('✅ Using service key (bypasses RLS)');
} else {
  console.log('⚠️  Using anon key (may have RLS restrictions)');
}

async function testEmailAndPDFGeneration() {
  try {
    console.log('🧪 Starting comprehensive email and PDF generation test...\n');
    console.log('=' .repeat(60));
    
    // Step 1: Import the email handler module
    console.log('\n📦 Step 1: Importing email handler module...');
    const { 
      createPDFBuffer, 
      gatherUserData, 
      filterDataBySettings,
      createEmailContent 
    } = await import('./api/send-last-wish-email.js');
    console.log('   ✅ Module imported successfully\n');
    
    // Step 2: Create user object
    console.log('👤 Step 2: Setting up user data...');
    const user = {
      id: USER_ID,
      email: USER_EMAIL,
      user_metadata: { full_name: 'Shalauddin Kader' }
    };
    console.log(`   User: ${user.email}`);
    console.log(`   Name: ${user.user_metadata.full_name}\n`);
    
    // Step 3: Fetch last wish settings
    console.log('⚙️  Step 3: Fetching last wish settings...');
    const { data: settingsList, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', USER_ID)
      .limit(1);
    
    let settingsData;
    if (settingsError || !settingsList || settingsList.length === 0) {
      console.log('   ⚠️  No settings found, using defaults...');
      settingsData = {
        user_id: USER_ID,
        is_enabled: true,
        is_active: true,
        recipients: [{ email: 'test@example.com', name: 'Test Recipient' }],
        include_data: {
          accounts: true,
          lendBorrow: true
        },
        message: 'If you\'re reading this, it means I haven\'t been able to check in as planned. I want you to know that I trust you completely with this information. Please use it wisely and take care of the things that matter most. Thank you for being there for me.',
        check_in_frequency: 30,
        last_check_in: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
        created_at: new Date().toISOString()
      };
    } else {
      settingsData = settingsList[0];
    }
    console.log(`   ✅ Settings loaded (enabled: ${settingsData.is_enabled})\n`);
    
    // Step 4: Gather user financial data
    console.log('📊 Step 4: Gathering user financial data...');
    const userData = await gatherUserData(USER_ID);
    console.log(`   Accounts: ${userData.accounts?.length || 0}`);
    console.log(`   Lend/Borrow: ${userData.lendBorrow?.length || 0}`);
    console.log(`   Active Lend/Borrow: ${(userData.lendBorrow || []).filter(lb => lb.status === 'active').length}`);
    console.log(`   Transactions: ${userData.transactions?.length || 0}\n`);
    
    // Step 5: Filter data based on settings
    console.log('🔍 Step 5: Filtering data based on settings...');
    const filteredData = filterDataBySettings(userData, settingsData.include_data || {});
    console.log('   ✅ Data filtered\n');
    
    // Step 6: Get recipient info
    const recipients = settingsData.recipients || [];
    const recipient = recipients.length > 0 ? recipients[0] : {
      email: 'test@example.com',
      name: 'Test Recipient'
    };
    console.log(`📧 Step 6: Using recipient: ${recipient.name || recipient.email}\n`);
    
    // Step 7: Generate email HTML content
    console.log('📝 Step 7: Generating email HTML content...');
    const emailContent = createEmailContent(user, recipient, filteredData, settingsData, true);
    console.log(`   ✅ Email HTML generated (${emailContent.length} characters)\n`);
    
    // Step 8: Save email HTML to file for preview
    console.log('💾 Step 8: Saving email HTML to file...');
    const emailOutputPath = join(__dirname, 'test-last-wish-email.html');
    writeFileSync(emailOutputPath, emailContent);
    console.log(`   ✅ Email HTML saved to: ${emailOutputPath}`);
    console.log(`   💡 Open this file in a browser to preview the email\n`);
    
    // Step 9: Generate PDF
    console.log('📄 Step 9: Generating PDF...');
    const pdfBuffer = await createPDFBuffer(user, recipient, filteredData, settingsData);
    console.log(`   ✅ PDF generated: ${pdfBuffer.length} bytes\n`);
    
    // Step 10: Save PDF to file
    console.log('💾 Step 10: Saving PDF to file...');
    const pdfOutputPath = join(__dirname, 'test-last-wish-pdf.pdf');
    writeFileSync(pdfOutputPath, pdfBuffer);
    console.log(`   ✅ PDF saved to: ${pdfOutputPath}\n`);
    
    // Step 11: Summary
    console.log('=' .repeat(60));
    console.log('🎉 TEST COMPLETE!\n');
    console.log('📋 Generated Files:');
    console.log(`   1. Email HTML: ${emailOutputPath}`);
    console.log(`   2. PDF Document: ${pdfOutputPath}\n`);
    console.log('✅ Verification Checklist:');
    console.log('   [ ] Open email HTML in browser');
    console.log('   [ ] Verify personal message appears after greeting');
    console.log('   [ ] Verify Financial Summary section (assets, accounts, lend/borrow)');
    console.log('   [ ] Verify simplified attachment card text');
    console.log('   [ ] Verify simplified "About This Delivery" section');
    console.log('   [ ] Verify simplified footer');
    console.log('   [ ] Open PDF and verify Financial Summary page (page 3)');
    console.log('   [ ] Verify PDF includes accounts and lend/borrow sections\n');
    console.log('🚀 If everything looks good, you can deploy!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailAndPDFGeneration();

