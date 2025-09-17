import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 TESTING 5-MINUTE FREQUENCY FOR EMAIL DELIVERY');
console.log('=' .repeat(60));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function test5MinuteFrequency() {
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
    
    // Step 1: Set frequency to 5 minutes (0.003472 days)
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        check_in_frequency: 0.003472, // 5 minutes in days
        last_check_in: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
        is_enabled: true,
        is_active: true,
        delivery_triggered: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSettings.user_id)
      .select();
    
    if (updateError) {
      console.log('❌ Failed to set 5-minute frequency:', updateError);
      return;
    }
    
    console.log('✅ Set 5-minute frequency with last check-in 6 minutes ago');
    
    // Step 2: Test the overdue detection
    const { data: overdueUsers, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    if (overdueError) {
      console.log('❌ Overdue check failed:', overdueError);
      return;
    }
    
    const isUserOverdue = overdueUsers?.some(user => user.user_id === existingSettings.user_id);
    console.log(`✅ User overdue status: ${isUserOverdue ? 'OVERDUE' : 'NOT OVERDUE'}`);
    
    if (isUserOverdue) {
      const overdueUser = overdueUsers.find(user => user.user_id === existingSettings.user_id);
      console.log(`✅ Minutes overdue: ${overdueUser.days_overdue}`);
      
      // Step 3: Test the delivery trigger
      const { data: triggerResult, error: triggerError } = await supabase
        .rpc('trigger_last_wish_delivery', { target_user_id: existingSettings.user_id });
      
      if (triggerError) {
        console.log('❌ Delivery trigger failed:', triggerError);
      } else {
        console.log(`✅ Delivery trigger result: ${triggerResult}`);
        console.log('✅ Email delivery should be triggered!');
      }
    }
    
    console.log('\n🎯 TESTING INSTRUCTIONS:');
    console.log('1. Go to your Last Wish settings in the browser');
    console.log('2. Select the "5m" frequency option');
    console.log('3. Click "Record Activity" to reset the timer');
    console.log('4. Wait 5 minutes');
    console.log('5. The system should detect you as overdue and send emails');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

test5MinuteFrequency();
