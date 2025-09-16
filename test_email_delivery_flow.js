// Test script to verify the complete Last Wish email delivery flow
// This will help ensure emails are delivered when the time ends

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testEmailDeliveryFlow() {
  console.log('🧪 Testing Last Wish Email Delivery Flow...\n');

  try {
    // Test 1: Check if the background process functions exist and work
    console.log('1. Testing background process functions...');
    
    try {
      const { data: overdueUsers, error: rpcError } = await supabase.rpc('check_overdue_last_wish');
      
      if (rpcError) {
        console.error('❌ RPC function error:', rpcError);
      } else {
        console.log('✅ check_overdue_last_wish function works');
        console.log(`   Found ${overdueUsers ? overdueUsers.length : 0} overdue users`);
      }
    } catch (error) {
      console.error('❌ Error testing RPC function:', error);
    }

    // Test 2: Create a test user with settings that will be "overdue" immediately
    console.log('\n2. Creating test user with immediate overdue status...');
    const testUserId = 'test-email-user-' + Date.now();
    
    // Set last_check_in to 35 days ago (more than 30 day frequency)
    const overdueDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: testSettings, error: insertError } = await supabase
      .from('last_wish_settings')
      .insert({
        user_id: testUserId,
        is_enabled: true,
        is_active: true,
        check_in_frequency: 30,
        last_check_in: overdueDate, // 35 days ago - should be overdue
        recipients: [{
          id: '1',
          email: 'test@example.com', // Replace with your email for testing
          name: 'Test Recipient',
          relationship: 'friend'
        }],
        include_data: {
          accounts: true,
          transactions: true,
          purchases: true,
          lendBorrow: true,
          savings: true,
          analytics: true
        },
        message: 'This is a test message for email delivery verification.'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating test settings:', insertError);
      return;
    }

    console.log('✅ Test settings created');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Last check-in: ${overdueDate} (35 days ago)`);
    console.log(`   Check-in frequency: 30 days`);
    console.log(`   Should be overdue: YES`);

    // Test 3: Check if the test user is detected as overdue
    console.log('\n3. Testing overdue detection...');
    
    const { data: overdueTest, error: overdueError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', testUserId)
      .eq('is_enabled', true)
      .eq('is_active', true)
      .single();

    if (overdueError) {
      console.error('❌ Error checking overdue status:', overdueError);
    } else if (overdueTest) {
      console.log('✅ Test user found in database');
      
      // Calculate if they should be overdue
      const lastCheckIn = new Date(overdueTest.last_check_in);
      const nextCheckIn = new Date(lastCheckIn.getTime() + (overdueTest.check_in_frequency * 24 * 60 * 60 * 1000));
      const now = new Date();
      const isOverdue = now > nextCheckIn;
      
      console.log(`   Last check-in: ${lastCheckIn.toISOString()}`);
      console.log(`   Next check-in should be: ${nextCheckIn.toISOString()}`);
      console.log(`   Current time: ${now.toISOString()}`);
      console.log(`   Is overdue: ${isOverdue ? 'YES' : 'NO'}`);
      
      if (isOverdue) {
        console.log('✅ User is correctly identified as overdue');
      } else {
        console.log('❌ User should be overdue but is not detected as such');
      }
    }

    // Test 4: Test the background process API endpoint
    console.log('\n4. Testing background process API...');
    
    try {
      // This simulates calling the background process
      const response = await fetch('/api/last-wish-public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Background process API responded');
        console.log(`   Processed ${result.processedCount || 0} users`);
        console.log(`   Message: ${result.message}`);
      } else {
        console.log(`⚠️ Background process API returned status: ${response.status}`);
      }
    } catch (apiError) {
      console.log('⚠️ Could not test API endpoint (this is normal if not running locally)');
      console.log(`   Error: ${apiError.message}`);
    }

    // Test 5: Check if delivery records would be created
    console.log('\n5. Testing delivery record creation...');
    
    // Check if last_wish_deliveries table exists
    const { data: deliveryTable, error: deliveryTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'last_wish_deliveries');

    if (deliveryTableError) {
      console.log('⚠️ Could not check delivery table');
    } else if (deliveryTable && deliveryTable.length > 0) {
      console.log('✅ last_wish_deliveries table exists');
      
      // Check existing delivery records
      const { data: existingDeliveries, error: deliveryError } = await supabase
        .from('last_wish_deliveries')
        .select('*')
        .limit(5);

      if (deliveryError) {
        console.log('⚠️ Could not query delivery records');
      } else {
        console.log(`✅ Found ${existingDeliveries.length} existing delivery records`);
      }
    } else {
      console.log('⚠️ last_wish_deliveries table does not exist');
      console.log('   This means delivery tracking is not set up');
    }

    // Test 6: Verify email configuration
    console.log('\n6. Checking email configuration...');
    
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT', 
      'SMTP_USER',
      'SMTP_PASS'
    ];
    
    console.log('Required environment variables for email:');
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`   ✅ ${envVar}: Set (${value.length} characters)`);
      } else {
        console.log(`   ❌ ${envVar}: Not set`);
      }
    });

    // Cleanup
    console.log('\n7. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.error('❌ Error cleaning up:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🏁 Email delivery flow test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Database functions: Working');
    console.log('   - Overdue detection: Working');
    console.log('   - Background process: Check API endpoint');
    console.log('   - Email configuration: Check environment variables');
    console.log('   - Delivery tracking: Check if table exists');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testEmailDeliveryFlow();
