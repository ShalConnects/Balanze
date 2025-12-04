/**
 * Fix the delivery status in the database
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

async function fixDeliveryStatus() {
  console.log('🔧 Fixing delivery status in database...\n');

  try {
    const userId = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    
    // Update the last_wish_settings to reflect that delivery has been triggered
    console.log('📝 Updating last_wish_settings...');
    const { data: updateResult, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        delivery_triggered: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.log(`❌ Update Error: ${updateError.message}`);
    } else {
      console.log('✅ Successfully updated last_wish_settings');
      console.log(`📊 Updated ${updateResult.length} record(s)`);
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log(`❌ Verification Error: ${settingsError.message}`);
    } else {
      console.log('✅ Current Status:');
      console.log(`  - delivery_triggered: ${settings.delivery_triggered}`);
      console.log(`  - is_active: ${settings.is_active}`);
      console.log(`  - is_enabled: ${settings.is_enabled}`);
    }

    console.log('\n🎯 NEXT STEPS - UI Updates Needed:');
    console.log('');
    console.log('📱 Dashboard Card (LW.tsx):');
    console.log('  - Check for delivery_triggered: true');
    console.log('  - Show "Email Delivered" status');
    console.log('  - Display delivery date from last_wish_deliveries');
    console.log('  - Change color to success (green/blue)');
    console.log('  - Remove countdown and urgent messaging');
    console.log('');
    console.log('⚙️ Settings Page:');
    console.log('  - Show delivery status and timestamp');
    console.log('  - List delivered recipients');
    console.log('  - Provide option to reactivate system');
    console.log('');
    console.log('🔄 The UI should now reflect that the Last Wish has been delivered!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixDeliveryStatus();
