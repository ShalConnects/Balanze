/**
 * Test script to generate and save Last Wish PDF locally
 * Run: node test-generate-pdf.js
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

// Use credentials from codebase (same as test_current_connection.js)
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

// Try to get service key from env, fallback to anon key
// Service key bypasses RLS and can read all data
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabaseKeyToUse = serviceKey || supabaseAnonKey;

// Set environment variables before importing the email handler
process.env.VITE_SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_SERVICE_KEY = supabaseKeyToUse;

// Create supabase client with service key if available (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKeyToUse);

if (serviceKey) {
  console.log('✅ Using service key (bypasses RLS)');
} else {
  console.log('⚠️  Using anon key (may have RLS restrictions)');
}

async function generateTestPDF() {
  try {
    console.log('📄 Starting PDF generation test...\n');
    
    // Step 1: Import the email handler module
    console.log('Step 1: Importing email handler module...');
    const { createPDFBuffer, gatherUserData, filterDataBySettings } = await import('./api/send-last-wish-email.js');
    
    // Step 2: Fetch user data
    console.log('Step 2: Fetching user data...');
    // Create user object directly (we know the ID and email)
    const user = {
      id: USER_ID,
      email: USER_EMAIL,
      user_metadata: { full_name: 'Shalauddin Kader' }
    };
    console.log(`   Using user: ${user.email}\n`);
    
    // Step 3: Fetch last wish settings
    console.log('Step 3: Fetching last wish settings...');
    const { data: settingsList, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', USER_ID)
      .limit(1);
    
    let settingsData;
    if (settingsError || !settingsList || settingsList.length === 0) {
      console.log('   No settings found, using defaults...');
      // Create default settings for testing
      settingsData = {
        user_id: USER_ID,
        is_enabled: true,
        is_active: true,
        recipients: [{ email: 'test@example.com', name: 'Test Recipient' }],
        include_data: {
          accounts: true,
          lendBorrow: true
        },
        message: 'Test message',
        check_in_frequency: 30,
        last_check_in: new Date().toISOString()
      };
    } else {
      settingsData = settingsList[0];
    }
    console.log(`   Settings: ${settingsData.is_enabled ? 'Enabled' : 'Disabled'}\n`);
    
    // Step 4: Gather user financial data
    console.log('Step 4: Gathering user financial data...');
    console.log('   Note: Using gatherUserData from email handler (uses service key from env)');
    
    // First, let's test direct queries to see if data exists
    console.log('   Testing direct queries...');
    const { data: testAccounts, error: testAccountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', USER_ID)
      .limit(5);
    console.log(`   Direct accounts query: ${testAccounts?.length || 0} found, error: ${testAccountsError?.message || 'none'}`);
    
    const { data: testLendBorrow, error: testLendBorrowError } = await supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', USER_ID)
      .limit(5);
    console.log(`   Direct lend_borrow query: ${testLendBorrow?.length || 0} found, error: ${testLendBorrowError?.message || 'none'}\n`);
    
    // Now use the email handler's gatherUserData
    const userData = await gatherUserData(USER_ID);
    console.log(`   gatherUserData results:`);
    console.log(`     Accounts: ${userData.accounts?.length || 0}`);
    console.log(`     Lend/Borrow: ${userData.lendBorrow?.length || 0}`);
    console.log(`     Active Lend/Borrow: ${(userData.lendBorrow || []).filter(lb => lb.status === 'active').length}\n`);
    
    // Step 5: Filter data based on settings
    console.log('Step 5: Filtering data based on settings...');
    const filteredData = filterDataBySettings(userData, settingsData.include_data || {});
    console.log('   Data filtered\n');
    
    // Step 6: Get recipient info (use first recipient or create a test one)
    const recipients = settingsData.recipients || [];
    const recipient = recipients.length > 0 ? recipients[0] : {
      email: 'test@example.com',
      name: 'Test Recipient'
    };
    console.log(`Step 6: Using recipient: ${recipient.email || recipient.name}\n`);
    
    // Step 7: Generate PDF
    console.log('Step 7: Generating PDF...');
    const pdfBuffer = await createPDFBuffer(user, recipient, filteredData, settingsData);
    console.log(`   PDF generated: ${pdfBuffer.length} bytes\n`);
    
    // Step 8: Save PDF to file
    console.log('Step 8: Saving PDF to file...');
    const outputPath = join(__dirname, 'test-last-wish-pdf.pdf');
    writeFileSync(outputPath, pdfBuffer);
    console.log(`   ✅ PDF saved to: ${outputPath}\n`);
    
    console.log('🎉 PDF generation complete!');
    console.log(`   You can now open: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
generateTestPDF();
