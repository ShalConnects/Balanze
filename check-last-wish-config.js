/**
 * Check Last Wish Configuration
 * 
 * This script checks if Last Wish is properly configured for a user
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

async function checkLastWishConfig(userId) {
  console.log(`🔍 Checking Last Wish configuration for user: ${userId}`);
  console.log('=' .repeat(60));
  
  try {
    // Check if user exists
    console.log('1️⃣ Checking user...');
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      return false;
    }
    
    console.log('✅ User found:', user.user.email);
    
    // Check Last Wish settings
    console.log('\n2️⃣ Checking Last Wish settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (settingsError) {
      console.error('❌ Last Wish settings not found:', settingsError.message);
      console.log('\n📋 To fix this:');
      console.log('1. Go to your app');
      console.log('2. Navigate to Last Wish settings');
      console.log('3. Enable Last Wish and configure recipients');
      return false;
    }
    
    console.log('✅ Last Wish settings found');
    console.log(`   - Enabled: ${settings.is_enabled}`);
    console.log(`   - Active: ${settings.is_active}`);
    console.log(`   - Check-in Frequency: ${settings.check_in_frequency} ${settings.check_in_frequency <= 60 ? 'minutes' : 'days'}`);
    console.log(`   - Recipients: ${settings.recipients?.length || 0}`);
    console.log(`   - Last Check-in: ${settings.last_check_in || 'Never'}`);
    
    if (!settings.recipients || settings.recipients.length === 0) {
      console.error('❌ No recipients configured');
      console.log('\n📋 To fix this:');
      console.log('1. Go to Last Wish settings in your app');
      console.log('2. Add recipients (email addresses)');
      console.log('3. Save the settings');
      return false;
    }
    
    console.log('\n3️⃣ Recipients configured:');
    settings.recipients.forEach((recipient, index) => {
      console.log(`   ${index + 1}. ${recipient.email} (${recipient.name}) - ${recipient.relationship}`);
    });
    
    // Check if already delivered
    console.log('\n4️⃣ Checking delivery history...');
    const { data: deliveries } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(5);
    
    if (deliveries && deliveries.length > 0) {
      console.log('📧 Recent deliveries:');
      deliveries.forEach((delivery, index) => {
        console.log(`   ${index + 1}. ${delivery.recipient_email} - ${delivery.delivery_status} - ${delivery.sent_at}`);
      });
    } else {
      console.log('📧 No previous deliveries found');
    }
    
    console.log('\n🎉 Last Wish is properly configured!');
    console.log('\n📧 To send test email, run:');
    console.log(`node email-sender.js ${userId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking configuration:', error);
    return false;
  }
}

// Main execution
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('Usage: node check-last-wish-config.js <userId>');
    console.log('Example: node check-last-wish-config.js cb3ac634-432d-4602-b2f9-3249702020d9');
    process.exit(1);
  }

  const isConfigured = await checkLastWishConfig(userId);
  
  if (!isConfigured) {
    console.log('\n❌ Last Wish is not properly configured. Please fix the issues above.');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
