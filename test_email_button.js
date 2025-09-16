// Test email button functionality
// This will trigger the overdue process and send emails immediately

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testEmailDelivery() {
  console.log('🧪 Testing Email Delivery - Immediate Test...\n');

  try {
    // Step 1: Check if user has Last Wish settings
    console.log('1. Checking Last Wish settings...');
    
    // Get current user (you'll need to pass the user ID)
    const userId = 'cb3ac634-432d-4602-b2f9-3249702020d9'; // Replace with actual user ID
    
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.error('❌ Error loading settings:', settingsError);
      return { success: false, error: 'Settings not found' };
    }

    if (!settings) {
      console.log('❌ No Last Wish settings found for user');
      return { success: false, error: 'No Last Wish settings configured' };
    }

    console.log('✅ Last Wish settings found');
    console.log(`   - is_enabled: ${settings.is_enabled}`);
    console.log(`   - is_active: ${settings.is_active}`);
    console.log(`   - recipients: ${settings.recipients.length}`);

    // Step 2: Check if recipients exist
    console.log('\n2. Checking recipients...');
    
    if (!settings.recipients || settings.recipients.length === 0) {
      console.log('❌ No recipients configured');
      return { success: false, error: 'No recipients configured' };
    }

    console.log(`✅ Found ${settings.recipients.length} recipients:`);
    settings.recipients.forEach((recipient, index) => {
      console.log(`   ${index + 1}. ${recipient.name} (${recipient.email}) - ${recipient.relationship}`);
    });

    // Step 3: Simulate overdue status by updating last_check_in
    console.log('\n3. Simulating overdue status...');
    
    const overdueDate = new Date(Date.now() - (settings.check_in_frequency + 5) * 24 * 60 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('last_wish_settings')
      .update({ 
        last_check_in: overdueDate,
        is_active: true // Ensure it's active
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating last_check_in:', updateError);
      return { success: false, error: 'Failed to simulate overdue status' };
    }

    console.log('✅ Simulated overdue status');
    console.log(`   - Set last_check_in to: ${overdueDate}`);
    console.log(`   - Check-in frequency: ${settings.check_in_frequency} days`);
    console.log(`   - Should be overdue: YES`);

    // Step 4: Trigger the background process
    console.log('\n4. Triggering background process...');
    
    try {
      const response = await fetch('/api/last-wish-public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Background process triggered successfully');
        console.log(`   - Processed: ${result.processedCount} users`);
        console.log(`   - Message: ${result.message}`);
        
        if (result.overdueUsers && result.overdueUsers.length > 0) {
          console.log('✅ Found overdue users:');
          result.overdueUsers.forEach(user => {
            console.log(`   - User: ${user.user_id}, Days overdue: ${user.days_overdue}`);
          });
        }
        
        return { success: true, result };
      } else {
        console.error(`❌ Background process failed: ${response.status}`);
        return { success: false, error: `API returned ${response.status}` };
      }
    } catch (apiError) {
      console.error('❌ Error calling background process:', apiError);
      return { success: false, error: 'Failed to trigger background process' };
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Export for use in the frontend
export { testEmailDelivery };
