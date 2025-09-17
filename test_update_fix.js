import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 TESTING UPDATE FIX');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testUpdateFix() {
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
    console.log(`Current enabled state: ${existingSettings.is_enabled}`);
    
    // Test the new UPDATE approach
    const newEnabledState = !existingSettings.is_enabled; // Toggle it
    
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        is_enabled: newEnabledState,
        check_in_frequency: existingSettings.check_in_frequency || 30,
        last_check_in: existingSettings.last_check_in,
        recipients: existingSettings.recipients || [],
        include_data: existingSettings.include_data || {},
        message: existingSettings.message || '',
        is_active: newEnabledState,
        delivery_triggered: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSettings.user_id)
      .select();
    
    if (updateError) {
      console.log('❌ Update failed:', updateError);
      console.log('❌ Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Update successful!');
      console.log(`✅ New enabled state: ${updateData[0]?.is_enabled}`);
      console.log('✅ The toggle should now work without 409 errors!');
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testUpdateFix();
