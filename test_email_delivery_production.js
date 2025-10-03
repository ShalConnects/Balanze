/**
 * Test script to verify the Last Wish email delivery functionality in production
 * This version tests against the actual deployed APIs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testProductionEmailDelivery() {
  console.log('🧪 Testing Last Wish Email Delivery System (Production)...\n');

  try {
    // Step 1: Test SMTP configuration
    console.log('📧 Step 1: Checking SMTP Configuration...');
    const smtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    let smtpConfigured = true;
    for (const varName of smtpVars) {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Configured`);
      } else {
        console.log(`❌ ${varName}: Missing`);
        smtpConfigured = false;
      }
    }

    // Step 2: Test database connection
    console.log('\n🗄️ Step 2: Testing Database Connection...');
    try {
      const { data, error } = await supabase.from('last_wish_settings').select('count').limit(1);
      if (error) {
        console.log(`❌ Database Connection: ${error.message}`);
      } else {
        console.log('✅ Database Connection: Working');
      }
    } catch (dbError) {
      console.log(`❌ Database Connection: ${dbError.message}`);
    }

    // Step 3: Test database functions (with fixed query)
    console.log('\n🔧 Step 3: Testing Database Functions...');
    try {
      const { data, error } = await supabase.rpc('check_overdue_last_wish');
      if (error) {
        console.log(`❌ check_overdue_last_wish(): ${error.message}`);
        console.log('💡 Fix: Run the updated fix_last_wish_delivery_triggered.sql');
      } else {
        console.log(`✅ check_overdue_last_wish(): Working (found ${Array.isArray(data) ? data.length : 0} users)`);
      }
    } catch (funcError) {
      console.log(`❌ check_overdue_last_wish(): ${funcError.message}`);
      console.log('💡 Fix: Run the updated fix_last_wish_delivery_triggered.sql');
    }

    // Step 4: Check table structure
    console.log('\n📊 Step 4: Checking Database Tables...');
    
    // Check last_wish_settings table structure
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('last_wish_settings')
        .select('user_id, is_enabled, delivery_triggered, recipients, last_check_in')
        .limit(1);
      
      if (settingsError) {
        console.log(`❌ last_wish_settings table: ${settingsError.message}`);
      } else {
        console.log('✅ last_wish_settings table: Accessible');
        if (settings.length > 0) {
          const columns = Object.keys(settings[0]);
          console.log(`📋 Columns: ${columns.join(', ')}`);
          if (columns.includes('delivery_triggered')) {
            console.log('✅ delivery_triggered column: Present');
          } else {
            console.log('⚠️ delivery_triggered column: Missing - run fix_last_wish_delivery_triggered.sql');
          }
        } else {
          console.log('ℹ️ No data in last_wish_settings table');
        }
      }
    } catch (tableError) {
      console.log(`❌ last_wish_settings table: ${tableError.message}`);
    }

    // Check last_wish_deliveries table
    try {
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('last_wish_deliveries')
        .select('id, user_id, delivery_status, sent_at')
        .limit(1);
      
      if (deliveriesError) {
        console.log(`❌ last_wish_deliveries table: ${deliveriesError.message}`);
        console.log('💡 Fix: Run ensure_last_wish_deliveries_table.sql');
      } else {
        console.log('✅ last_wish_deliveries table: Accessible');
        if (deliveries.length > 0) {
          console.log(`📋 Recent deliveries: ${deliveries.length}`);
        } else {
          console.log('ℹ️ No delivery records yet');
        }
      }
    } catch (tableError) {
      console.log(`❌ last_wish_deliveries table: ${tableError.message}`);
      console.log('💡 Fix: Run ensure_last_wish_deliveries_table.sql');
    }

    // Step 5: Test production API endpoints
    console.log('\n🌐 Step 5: Testing Production API Endpoints...');
    const baseUrl = 'https://balanze.cash'; // Your production URL
    
    // Test email API
    try {
      const testResponse = await fetch(`${baseUrl}/api/send-last-wish-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id', testMode: true })
      });
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log('✅ Email API: Accessible');
        console.log(`📧 Response: ${result.message || 'Success'}`);
      } else {
        console.log(`⚠️ Email API: ${testResponse.status} ${testResponse.statusText}`);
        const errorText = await testResponse.text();
        console.log(`📋 Error details: ${errorText.substring(0, 200)}...`);
      }
    } catch (apiError) {
      console.log(`❌ Email API: ${apiError.message}`);
    }

    // Test background process API
    try {
      const bgResponse = await fetch(`${baseUrl}/api/last-wish-public`);
      
      if (bgResponse.ok) {
        const bgResult = await bgResponse.json();
        console.log('✅ Background Process API: Working');
        console.log(`📊 Processed users: ${bgResult.processedCount || 0}`);
        if (bgResult.emailsSent !== undefined) {
          console.log(`📧 Emails sent: ${bgResult.emailsSent}`);
        }
      } else {
        console.log(`❌ Background Process API: ${bgResponse.status} ${bgResponse.statusText}`);
      }
    } catch (bgError) {
      console.log(`❌ Background Process API: ${bgError.message}`);
    }

    // Step 6: Summary and recommendations
    console.log('\n📋 DEPLOYMENT CHECKLIST:');
    console.log('');
    
    if (smtpConfigured) {
      console.log('✅ SMTP Configuration: Ready');
    } else {
      console.log('❌ SMTP Configuration: Need to set environment variables in Vercel');
    }
    
    console.log('📝 Next Steps:');
    console.log('1. Run the SQL fixes in Supabase Dashboard > SQL Editor:');
    console.log('   - fix_last_wish_delivery_triggered.sql (updated version)');
    console.log('   - ensure_last_wish_deliveries_table.sql');
    console.log('');
    console.log('2. Deploy the updated code to Vercel');
    console.log('');
    console.log('3. Test with a real user scenario:');
    console.log('   - Create Last Wish settings for a test user');
    console.log('   - Set check-in frequency to 1 day');
    console.log('   - Manually update last_check_in to 2 days ago');
    console.log('   - Call the background process API');
    console.log('   - Check if email is received');
    console.log('');
    console.log('🎯 The system should work once the SQL fixes are applied!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProductionEmailDelivery();
