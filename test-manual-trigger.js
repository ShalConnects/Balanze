/**
 * Manual Test Script for Last Wish Email Trigger
 * 
 * Usage:
 * 1. Set your environment variables:
 *    - VITE_SUPABASE_URL or SUPABASE_URL
 *    - SUPABASE_SERVICE_KEY
 *    - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * 
 * 2. Update the userId below with the actual user ID
 * 
 * 3. Run: node test-manual-trigger.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// UPDATE THIS WITH YOUR USER ID
const userId = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

async function testManualTrigger() {
  console.log('🚀 Testing Manual Last Wish Email Trigger...\n');
  console.log(`User ID: ${userId}\n`);

  try {
    // Check user settings
    console.log('📋 Checking user settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      console.error('❌ Error:', settingsError?.message || 'Settings not found');
      return;
    }

    console.log('✅ Settings found:');
    console.log(`   - Enabled: ${settings.is_enabled}`);
    console.log(`   - Active: ${settings.is_active}`);
    console.log(`   - Delivery Triggered: ${settings.delivery_triggered}`);
    console.log(`   - Check-in Frequency: ${settings.check_in_frequency} days`);
    console.log(`   - Last Check-in: ${settings.last_check_in}`);
    console.log(`   - Recipients: ${settings.recipients?.length || 0}\n`);

    // Check if overdue
    const lastCheckIn = new Date(settings.last_check_in);
    const nextCheckIn = new Date(lastCheckIn.getTime() + (settings.check_in_frequency * 24 * 60 * 60 * 1000));
    const now = new Date();
    const hoursOverdue = (now - nextCheckIn) / (1000 * 60 * 60);

    console.log('⏰ Time Check:');
    console.log(`   - Last Check-in: ${lastCheckIn.toISOString()}`);
    console.log(`   - Next Check-in Deadline: ${nextCheckIn.toISOString()}`);
    console.log(`   - Current Time: ${now.toISOString()}`);
    console.log(`   - Hours Overdue: ${hoursOverdue.toFixed(2)}\n`);

    if (hoursOverdue <= 0) {
      console.log('⚠️  User is not overdue yet. Cannot trigger email.');
      return;
    }

    // Call the manual trigger API
    console.log('📧 Triggering email via API...');
    const response = await fetch('http://localhost:5173/api/manual-trigger-last-wish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log('   Message:', result.message);
      console.log('   Result:', JSON.stringify(result.result, null, 2));
    } else {
      console.log('❌ FAILED!');
      console.log('   Error:', result.error);
      console.log('   Details:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testManualTrigger();

