import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 TESTING CHECK-IN FREQUENCY FIX');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testFrequencyFix() {
  try {
    // Get existing user
    const { data: existingSettings, error: fetchError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (fetchError || !existingSettings) {
      console.log('❌ No existing settings found to test with');
      return;
    }
    
    console.log(`✅ Testing with user: ${existingSettings.user_id}`);
    console.log(`Current frequency: ${existingSettings.check_in_frequency} days`);
    
    // Test updating to a different frequency
    const newFrequency = existingSettings.check_in_frequency === 30 ? 7 : 30;
    
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        is_enabled: existingSettings.is_enabled,
        check_in_frequency: newFrequency,
        last_check_in: existingSettings.last_check_in,
        recipients: existingSettings.recipients || [],
        include_data: existingSettings.include_data || {},
        message: existingSettings.message || '',
        is_active: existingSettings.is_active,
        delivery_triggered: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSettings.user_id)
      .select();
    
    if (updateError) {
      console.log('❌ Frequency update failed:', updateError);
      console.log('❌ Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Frequency update successful!');
      console.log(`✅ New frequency: ${updateData[0]?.check_in_frequency} days`);
      console.log('✅ The Activity Monitoring Configuration should now work!');
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testFrequencyFix();
