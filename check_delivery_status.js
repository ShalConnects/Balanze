/**
 * Check the current delivery status after email was sent
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

async function checkDeliveryStatus() {
  console.log('📊 Checking current Last Wish delivery status...\n');

  try {
    const userId = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    
    // Check last_wish_settings
    console.log('1. Checking last_wish_settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log(`❌ Settings Error: ${settingsError.message}`);
    } else {
      console.log('✅ Current Settings:');
      console.log(`  - is_enabled: ${settings.is_enabled}`);
      console.log(`  - is_active: ${settings.is_active}`);
      console.log(`  - delivery_triggered: ${settings.delivery_triggered}`);
      console.log(`  - last_check_in: ${settings.last_check_in}`);
      console.log(`  - recipients: ${settings.recipients?.length || 0}`);
    }

    // Check last_wish_deliveries
    console.log('\n2. Checking delivery records...');
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false });

    if (deliveriesError) {
      console.log(`❌ Deliveries Error: ${deliveriesError.message}`);
    } else {
      console.log(`✅ Found ${deliveries.length} delivery record(s):`);
      deliveries.forEach((delivery, index) => {
        console.log(`\n📧 Delivery ${index + 1}:`);
        console.log(`  - Recipient: ${delivery.recipient_email}`);
        console.log(`  - Status: ${delivery.delivery_status}`);
        console.log(`  - Sent At: ${delivery.sent_at}`);
        console.log(`  - Error: ${delivery.error_message || 'None'}`);
      });
    }

    // UI Update Requirements
    console.log('\n🎯 UI UPDATE REQUIREMENTS:');
    
    if (settings?.delivery_triggered) {
      console.log('✅ Email has been delivered - UI should show:');
      console.log('  📱 Dashboard Card:');
      console.log('    - Status: "Email Delivered"');
      console.log('    - Color: Green/Blue (success)');
      console.log('    - Message: "Your Last Wish has been delivered"');
      console.log('    - Show delivery date');
      console.log('    - Remove countdown and urgent warnings');
      console.log('');
      console.log('  ⚙️ Settings Page:');
      console.log('    - Show "Delivered" status');
      console.log('    - List recipients who received emails');
      console.log('    - Show delivery timestamp');
      console.log('    - Provide option to reactivate');
    } else {
      console.log('⚠️ Email not delivered yet - current UI is correct');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkDeliveryStatus();
