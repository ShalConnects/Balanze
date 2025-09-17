import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('📧 MANUAL EMAIL DELIVERY TRIGGER');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function triggerEmailDelivery() {
  try {
    // Get the overdue user with recipients
    const { data: overdueUsers, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    if (overdueError) {
      console.log('❌ Failed to get overdue users:', overdueError);
      return;
    }
    
    console.log(`✅ Found ${overdueUsers?.length || 0} overdue users`);
    
    for (const user of overdueUsers || []) {
      console.log(`\n📧 Processing user: ${user.email}`);
      
      // Get user's settings including recipients
      const { data: settings, error: settingsError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      if (settingsError) {
        console.log(`❌ Failed to get settings for ${user.email}:`, settingsError);
        continue;
      }
      
      console.log(`   Recipients: ${settings.recipients?.length || 0}`);
      
      if (!settings.recipients || settings.recipients.length === 0) {
        console.log(`   ⚠️ SKIPPING: No recipients configured for ${user.email}`);
        continue;
      }
      
      // Test the email API endpoint
      console.log(`   🔄 Triggering email delivery...`);
      
      try {
        const response = await fetch('https://balanze.cash/api/last-wish-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.user_id,
            testMode: false // Real email delivery
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Email API response:`, result);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Email API failed: ${response.status} - ${errorText}`);
        }
        
      } catch (apiError) {
        console.log(`   ❌ Email API error:`, apiError.message);
      }
      
      // Mark delivery as triggered to prevent duplicates
      const { error: markError } = await supabase
        .from('last_wish_settings')
        .update({ delivery_triggered: true })
        .eq('user_id', user.user_id);
      
      if (markError) {
        console.log(`   ❌ Failed to mark delivery as triggered:`, markError);
      } else {
        console.log(`   ✅ Marked delivery as triggered`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- Checked all overdue users');
    console.log('- Attempted email delivery for users with recipients');
    console.log('- Marked deliveries as triggered');
    
    console.log('\n📧 CHECK YOUR EMAIL:');
    console.log('- If you had recipients configured, check your email');
    console.log('- Email should contain your financial data');
    console.log('- Subject: "Financial Legacy Documentation from [Your Name]"');
    
  } catch (error) {
    console.log('❌ Manual trigger failed:', error.message);
  }
}

triggerEmailDelivery();
