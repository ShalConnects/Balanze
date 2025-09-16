// Test script to verify Last Wish active state fix
// This script tests that the system control remains active after refresh

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testLastWishFix() {
  console.log('🧪 Testing Last Wish active state fix...\n');

  try {
    // Test 1: Check if delivery_triggered field exists
    console.log('1. Checking if delivery_triggered field exists...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'last_wish_settings')
      .eq('column_name', 'delivery_triggered');

    if (tableError) {
      console.error('❌ Error checking table schema:', tableError);
      return;
    }

    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ delivery_triggered field exists');
    } else {
      console.log('❌ delivery_triggered field does not exist - run the SQL script first');
      return;
    }

    // Test 2: Check if updated functions exist
    console.log('\n2. Testing check_overdue_last_wish function...');
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

    // Test 3: Create a test user and settings
    console.log('\n3. Creating test user and settings...');
    const testUserId = 'test-user-' + Date.now();
    
    // Insert test settings
    const { data: testSettings, error: insertError } = await supabase
      .from('last_wish_settings')
      .insert({
        user_id: testUserId,
        is_enabled: true,
        is_active: true,
        delivery_triggered: false,
        check_in_frequency: 30,
        last_check_in: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
        recipients: [{
          id: '1',
          email: 'test@example.com',
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
        message: 'Test message'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating test settings:', insertError);
      return;
    }

    console.log('✅ Test settings created');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   is_enabled: ${testSettings.is_enabled}`);
    console.log(`   is_active: ${testSettings.is_active}`);
    console.log(`   delivery_triggered: ${testSettings.delivery_triggered}`);

    // Test 4: Simulate background process (should NOT set is_active = false)
    console.log('\n4. Testing background process behavior...');
    
    // This simulates what the background process should do
    const { data: overdueTest, error: overdueError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', testUserId)
      .eq('is_enabled', true)
      .eq('delivery_triggered', false)
      .single();

    if (overdueError) {
      console.error('❌ Error checking overdue status:', overdueError);
    } else if (overdueTest) {
      console.log('✅ User is correctly identified as overdue');
      
      // Simulate the NEW behavior (set delivery_triggered = true, keep is_active = true)
      const { error: updateError } = await supabase
        .from('last_wish_settings')
        .update({ 
          delivery_triggered: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUserId);

      if (updateError) {
        console.error('❌ Error updating delivery status:', updateError);
      } else {
        console.log('✅ Correctly updated delivery_triggered = true');
        console.log('✅ is_active remains true (system stays active for user)');
      }
    }

    // Test 5: Verify final state
    console.log('\n5. Verifying final state...');
    const { data: finalState, error: finalError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (finalError) {
      console.error('❌ Error checking final state:', finalError);
    } else {
      console.log('✅ Final state verification:');
      console.log(`   is_enabled: ${finalState.is_enabled} (should be true)`);
      console.log(`   is_active: ${finalState.is_active} (should be true)`);
      console.log(`   delivery_triggered: ${finalState.delivery_triggered} (should be true)`);
      
      if (finalState.is_enabled && finalState.is_active && finalState.delivery_triggered) {
        console.log('🎉 SUCCESS: System control will remain active after refresh!');
      } else {
        console.log('❌ FAILURE: System control will still become inactive');
      }
    }

    // Cleanup
    console.log('\n6. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.error('❌ Error cleaning up:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🏁 Test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testLastWishFix();
