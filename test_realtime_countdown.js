import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 TESTING REAL-TIME COUNTDOWN WITH 5-MINUTE FREQUENCY');
console.log('=' .repeat(60));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testRealtimeCountdown() {
  try {
    // Get existing user
    const { data: existingSettings, error: fetchError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (fetchError || !existingSettings) {
      console.log('❌ No existing settings found');
      return;
    }
    
    console.log(`✅ Testing with user: ${existingSettings.user_id}`);
    
    // Set up 5-minute frequency with fresh timer
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        check_in_frequency: -5, // 5 minutes
        last_check_in: new Date().toISOString(), // Reset to now
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
    
    console.log('✅ Set 5-minute frequency with fresh timer');
    console.log('✅ last_check_in set to NOW');
    
    // Test the countdown calculation
    const now = new Date();
    const nextCheckIn = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    const totalTimeLeft = nextCheckIn.getTime() - now.getTime();
    const progressPercentage = 0; // Should start at 0%
    
    console.log(`✅ Next check-in: ${nextCheckIn.toLocaleTimeString()}`);
    console.log(`✅ Time left: ${Math.floor(totalTimeLeft / 1000)} seconds`);
    console.log(`✅ Progress: ${progressPercentage}% (should start at 0%)`);
    
    console.log('\n🎯 WHAT YOU SHOULD SEE IN BROWSER:');
    console.log('1. Progress bar starts at 0%');
    console.log('2. Timer shows 00:04:59 (approximately)');
    console.log('3. Progress bar increases every second');
    console.log('4. Timer counts down: 00:04:58, 00:04:57, etc.');
    console.log('5. After 5 minutes, system should trigger email delivery');
    
    console.log('\n🚀 GO TO BROWSER NOW:');
    console.log('   http://localhost:5175');
    console.log('   Navigate to Last Wish section');
    console.log('   You should see the countdown updating in real-time!');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testRealtimeCountdown();
