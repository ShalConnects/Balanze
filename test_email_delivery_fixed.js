/**
 * Test script to verify the Last Wish email delivery functionality
 * Run this after applying the fixes to ensure emails are working
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

async function testEmailDelivery() {
  console.log('🧪 Testing Last Wish Email Delivery System...\n');

  try {
    // Step 1: Test SMTP configuration
    console.log('📧 Step 1: Checking SMTP Configuration...');
    const smtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    for (const varName of smtpVars) {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Configured`);
      } else {
        console.log(`❌ ${varName}: Missing`);
      }
    }

    // Step 2: Test API endpoint accessibility
    console.log('\n🔗 Step 2: Testing API Endpoint...');
    try {
      const testResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'}/api/send-last-wish-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id', testMode: true })
      });
      
      if (testResponse.ok) {
        console.log('✅ API Endpoint: Accessible');
      } else {
        console.log(`⚠️ API Endpoint: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (apiError) {
      console.log(`❌ API Endpoint: ${apiError.message}`);
    }

    // Step 3: Check database functions
    console.log('\n🗄️ Step 3: Testing Database Functions...');
    try {
      const { data, error } = await supabase.rpc('check_overdue_last_wish');
      if (error) {
        console.log(`❌ check_overdue_last_wish(): ${error.message}`);
      } else {
        console.log(`✅ check_overdue_last_wish(): Working (found ${Array.isArray(data) ? data.length : 0} users)`);
      }
    } catch (funcError) {
      console.log(`❌ check_overdue_last_wish(): ${funcError.message}`);
    }

    // Step 4: Check table structure
    console.log('\n📊 Step 4: Checking Database Tables...');
    
    // Check last_wish_settings table
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('last_wish_settings')
        .select('user_id, is_enabled, delivery_triggered')
        .limit(1);
      
      if (settingsError) {
        console.log(`❌ last_wish_settings table: ${settingsError.message}`);
      } else {
        console.log('✅ last_wish_settings table: Accessible');
        if (settings.length > 0 && 'delivery_triggered' in settings[0]) {
          console.log('✅ delivery_triggered column: Present');
        } else {
          console.log('⚠️ delivery_triggered column: Missing or no data');
        }
      }
    } catch (tableError) {
      console.log(`❌ last_wish_settings table: ${tableError.message}`);
    }

    // Check last_wish_deliveries table
    try {
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('last_wish_deliveries')
        .select('id, user_id, delivery_status')
        .limit(1);
      
      if (deliveriesError) {
        console.log(`❌ last_wish_deliveries table: ${deliveriesError.message}`);
      } else {
        console.log('✅ last_wish_deliveries table: Accessible');
      }
    } catch (tableError) {
      console.log(`❌ last_wish_deliveries table: ${tableError.message}`);
    }

    // Step 5: Test background process
    console.log('\n⚙️ Step 5: Testing Background Process...');
    try {
      const bgResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'}/api/last-wish-public`);
      
      if (bgResponse.ok) {
        const bgResult = await bgResponse.json();
        console.log('✅ Background Process: Working');
        console.log(`📊 Found ${bgResult.processedCount} overdue users`);
        if (bgResult.emailsSent !== undefined) {
          console.log(`📧 Emails sent: ${bgResult.emailsSent}`);
        }
      } else {
        console.log(`❌ Background Process: ${bgResponse.status} ${bgResponse.statusText}`);
      }
    } catch (bgError) {
      console.log(`❌ Background Process: ${bgError.message}`);
    }

    console.log('\n📋 Test Summary:');
    console.log('1. Apply the SQL fixes if database errors were found:');
    console.log('   - Run fix_last_wish_delivery_triggered.sql in Supabase');
    console.log('   - Run ensure_last_wish_deliveries_table.sql in Supabase');
    console.log('2. Deploy the updated code to Vercel');
    console.log('3. Test with a real user scenario');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailDelivery();
