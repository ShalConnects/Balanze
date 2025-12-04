import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('📧 SETUP AND TEST EMAIL DELIVERY');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupAndTestEmailDelivery() {
  try {
    // Get the user without recipients
    const { data: userWithoutRecipients, error: fetchError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', 'd1fe3ccc-3c57-4621-866a-6d0643137d53')
      .single();
    
    if (fetchError) {
      console.log('❌ Failed to get user settings:', fetchError);
      return;
    }
    
    console.log('✅ Found user without recipients');
    
    // Add yourself as a recipient
    const recipients = [
      {
        id: '1',
        email: 'salauddin.kader406@gmail.com', // Your email
        name: 'Salauddin Kader',
        relationship: 'owner'
      }
    ];
    
    console.log('📧 Adding recipient...');
    
    // Update settings with recipient and reset timer
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        recipients: recipients,
        check_in_frequency: -5, // 5 minutes
        last_check_in: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago (already overdue)
        is_enabled: true,
        is_active: true,
        delivery_triggered: false, // Reset to allow delivery
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', 'd1fe3ccc-3c57-4621-866a-6d0643137d53')
      .select();
    
    if (updateError) {
      console.log('❌ Failed to update settings:', updateError);
      return;
    }
    
    console.log('✅ Recipient added and timer set to 6 minutes ago (overdue)');
    
    // Now test email delivery
    console.log('\n📧 Testing email delivery...');
    
    try {
      const response = await fetch('https://balanze.cash/api/last-wish-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email delivery API response:', result);
        
        if (result.success) {
          console.log(`✅ Processed ${result.processedCount} users`);
          console.log('📧 CHECK YOUR EMAIL: salauddin.kader406@gmail.com');
          console.log('   Subject: "Financial Legacy Documentation from Salauddin Kader"');
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Email API failed: ${response.status} - ${errorText}`);
      }
      
    } catch (apiError) {
      console.log('❌ Email API error:', apiError.message);
    }
    
    // Check delivery records
    console.log('\n📬 Checking delivery records...');
    const { data: deliveries, error: deliveryError } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', 'd1fe3ccc-3c57-4621-866a-6d0643137d53')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (deliveryError) {
      console.log('❌ Error checking deliveries:', deliveryError);
    } else {
      console.log(`✅ Found ${deliveries?.length || 0} delivery records for this user`);
      deliveries?.forEach((delivery, i) => {
        console.log(`   ${i + 1}. Status: ${delivery.delivery_status}, Email: ${delivery.recipient_email}, Time: ${delivery.created_at}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  }
}

setupAndTestEmailDelivery();
