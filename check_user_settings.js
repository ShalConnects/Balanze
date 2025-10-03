/**
 * Check the user's Last Wish settings in the database
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

async function checkUserSettings() {
  console.log('🔍 Checking Last Wish Settings for user...\n');

  try {
    const userId = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    
    // Check if user exists in last_wish_settings
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId);

    if (settingsError) {
      console.log(`❌ Error fetching settings: ${settingsError.message}`);
      return;
    }

    console.log(`📊 Found ${settings.length} settings record(s) for user ${userId}`);
    
    if (settings.length === 0) {
      console.log('❌ No Last Wish settings found for this user');
      console.log('💡 This explains why email delivery fails');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. User needs to set up Last Wish in the UI');
      console.log('2. Add recipients and configure settings');
      console.log('3. Then the email delivery will work');
    } else {
      console.log('✅ Settings found! Details:');
      settings.forEach((setting, index) => {
        console.log(`\n📋 Record ${index + 1}:`);
        console.log(`  - ID: ${setting.id}`);
        console.log(`  - Enabled: ${setting.is_enabled}`);
        console.log(`  - Active: ${setting.is_active}`);
        console.log(`  - Check-in Frequency: ${setting.check_in_frequency} days`);
        console.log(`  - Last Check-in: ${setting.last_check_in}`);
        console.log(`  - Delivery Triggered: ${setting.delivery_triggered}`);
        console.log(`  - Recipients: ${setting.recipients ? JSON.stringify(setting.recipients).substring(0, 100) + '...' : 'None'}`);
        console.log(`  - Message: ${setting.message ? setting.message.substring(0, 50) + '...' : 'None'}`);
      });
      
      // Check if settings are properly configured for email delivery
      const validSettings = settings.filter(s => 
        s.is_enabled && 
        s.is_active && 
        s.recipients && 
        s.recipients.length > 0
      );
      
      if (validSettings.length === 0) {
        console.log('\n⚠️ Settings exist but not properly configured for email delivery');
        console.log('📋 Required for email delivery:');
        console.log('  - is_enabled: true');
        console.log('  - is_active: true');
        console.log('  - recipients: at least one recipient');
      } else {
        console.log(`\n✅ ${validSettings.length} properly configured settings found`);
        console.log('📧 Email delivery should work!');
      }
    }

  } catch (error) {
    console.error('❌ Failed to check settings:', error.message);
  }
}

// Run the check
checkUserSettings();
