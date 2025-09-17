import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 CHECKING OVERDUE STATUS AND EMAIL DELIVERY');
console.log('=' .repeat(60));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkOverdueStatus() {
  try {
    // Check current Last Wish settings
    console.log('📊 Current Last Wish settings:');
    const { data: allSettings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*');
    
    if (settingsError) {
      console.log('❌ Error fetching settings:', settingsError);
      return;
    }
    
    allSettings?.forEach((setting, i) => {
      const lastCheckIn = setting.last_check_in ? new Date(setting.last_check_in) : null;
      const now = new Date();
      const timeElapsed = lastCheckIn ? Math.floor((now.getTime() - lastCheckIn.getTime()) / 1000) : 0;
      
      console.log(`\n${i + 1}. User: ${setting.user_id}`);
      console.log(`   Enabled: ${setting.is_enabled}`);
      console.log(`   Active: ${setting.is_active}`);
      console.log(`   Delivery Triggered: ${setting.delivery_triggered}`);
      console.log(`   Frequency: ${setting.check_in_frequency}`);
      console.log(`   Last Check-in: ${setting.last_check_in}`);
      console.log(`   Time elapsed: ${timeElapsed} seconds`);
      console.log(`   Recipients: ${setting.recipients?.length || 0}`);
      
      if (setting.check_in_frequency === -5 && timeElapsed > 300) {
        console.log(`   🚨 STATUS: OVERDUE (${Math.floor(timeElapsed/60)} minutes ago)`);
      }
    });
    
    // Test the overdue detection function
    console.log('\n📧 Testing overdue detection function:');
    const { data: overdueUsers, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    if (overdueError) {
      console.log('❌ Overdue check failed:', overdueError);
    } else {
      console.log(`✅ Found ${overdueUsers?.length || 0} overdue users`);
      overdueUsers?.forEach((user, i) => {
        console.log(`   ${i + 1}. User: ${user.user_id}, Email: ${user.email}, Overdue: ${user.days_overdue} units`);
      });
    }
    
    // Check if there are any delivery records
    console.log('\n📬 Checking delivery records:');
    const { data: deliveries, error: deliveryError } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (deliveryError) {
      console.log('❌ Error checking deliveries:', deliveryError);
    } else {
      console.log(`✅ Found ${deliveries?.length || 0} delivery records`);
      deliveries?.forEach((delivery, i) => {
        console.log(`   ${i + 1}. User: ${delivery.user_id}, Status: ${delivery.delivery_status}, Created: ${delivery.created_at}`);
      });
    }
    
    // Test the API endpoints manually
    console.log('\n🌐 Testing API endpoints:');
    
    try {
      const response = await fetch('https://balanze.cash/api/last-wish-public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      console.log(`✅ Public API: ${response.status} - ${result.message}`);
      console.log(`   Processed: ${result.processedCount} users`);
      
    } catch (error) {
      console.log('❌ API test failed:', error.message);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    
    const overdueCount = overdueUsers?.length || 0;
    const deliveryCount = deliveries?.length || 0;
    
    if (overdueCount === 0) {
      console.log('❌ ISSUE: No overdue users detected');
      console.log('   → Database function may not be working correctly');
      console.log('   → Check if SQL update was applied');
    } else {
      console.log(`✅ Overdue detection working: ${overdueCount} users found`);
    }
    
    if (deliveryCount === 0) {
      console.log('❌ ISSUE: No email delivery attempts recorded');
      console.log('   → Email delivery system not triggering');
      console.log('   → Need to check API endpoints and email service');
    } else {
      console.log(`✅ Email delivery system active: ${deliveryCount} attempts`);
    }
    
  } catch (error) {
    console.log('❌ Check failed:', error.message);
  }
}

checkOverdueStatus();
