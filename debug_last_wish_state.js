// Debug script to check Last Wish state in database
// This will help us understand what's actually happening

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugLastWishState() {
  console.log('🔍 Debugging Last Wish state...\n');

  try {
    // Check if delivery_triggered field exists
    console.log('1. Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'last_wish_settings')
      .order('ordinal_position');

    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError);
      return;
    }

    console.log('📋 Database columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    const hasDeliveryTriggered = columns.some(col => col.column_name === 'delivery_triggered');
    console.log(`\n✅ delivery_triggered field exists: ${hasDeliveryTriggered}`);

    // Check current settings for all users
    console.log('\n2. Checking current Last Wish settings...');
    const { data: allSettings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return;
    }

    console.log(`📊 Found ${allSettings.length} Last Wish settings records:`);
    allSettings.forEach((setting, index) => {
      console.log(`\n   Record ${index + 1}:`);
      console.log(`   - User ID: ${setting.user_id}`);
      console.log(`   - is_enabled: ${setting.is_enabled}`);
      console.log(`   - is_active: ${setting.is_active}`);
      console.log(`   - delivery_triggered: ${setting.delivery_triggered || 'N/A'}`);
      console.log(`   - last_check_in: ${setting.last_check_in || 'Never'}`);
      console.log(`   - updated_at: ${setting.updated_at}`);
    });

    // Test the toggle function behavior
    console.log('\n3. Testing toggle behavior...');
    if (allSettings.length > 0) {
      const testSetting = allSettings[0];
      console.log(`🧪 Testing with user: ${testSetting.user_id}`);
      
      // Simulate what happens when you toggle the system
      const newEnabledState = !testSetting.is_enabled;
      console.log(`   Current is_enabled: ${testSetting.is_enabled}`);
      console.log(`   Would set is_enabled to: ${newEnabledState}`);
      console.log(`   Would set is_active to: ${newEnabledState}`);
      
      if (hasDeliveryTriggered) {
        console.log(`   Would keep delivery_triggered as: ${testSetting.delivery_triggered}`);
      }
    }

    // Check if there are any background processes running
    console.log('\n4. Checking for background process activity...');
    const { data: recentUpdates, error: recentError } = await supabase
      .from('last_wish_settings')
      .select('user_id, is_enabled, is_active, updated_at')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('updated_at', { ascending: false });

    if (recentError) {
      console.error('❌ Error checking recent updates:', recentError);
    } else {
      console.log(`📈 Recent updates (last 24 hours): ${recentUpdates.length}`);
      recentUpdates.forEach(update => {
        console.log(`   - User ${update.user_id}: enabled=${update.is_enabled}, active=${update.is_active} at ${update.updated_at}`);
      });
    }

    console.log('\n🏁 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugLastWishState();
