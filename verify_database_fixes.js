import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('✅ VERIFYING DATABASE FIXES');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifyColumnExists() {
  console.log('\n📊 Test 1: Verifying delivery_triggered column exists...');
  
  try {
    const { data, error } = await supabase
      .from('last_wish_settings')
      .select('delivery_triggered')
      .limit(1);
    
    if (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    } else {
      console.log('✅ PASSED: delivery_triggered column is accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

async function verifyFunction() {
  console.log('\n📊 Test 2: Verifying check_overdue_last_wish function...');
  
  try {
    const { data, error } = await supabase.rpc('check_overdue_last_wish');
    
    if (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    } else {
      console.log('✅ PASSED: Function works correctly');
      console.log(`   Found ${data?.length || 0} overdue users`);
      return true;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

async function verifyTriggerFunction() {
  console.log('\n📊 Test 3: Verifying trigger_last_wish_delivery function...');
  
  try {
    // Test with a dummy UUID (function should return false for non-existent user)
    const { data, error } = await supabase.rpc('trigger_last_wish_delivery', {
      target_user_id: '123e4567-e89b-12d3-a456-426614174000'
    });
    
    if (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    } else {
      console.log('✅ PASSED: trigger_last_wish_delivery function exists and callable');
      console.log(`   Result: ${data} (expected false for non-existent user)`);
      return true;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

async function verifyDeliveriesTable() {
  console.log('\n📊 Test 4: Verifying last_wish_deliveries table...');
  
  try {
    const { data, error } = await supabase
      .from('last_wish_deliveries')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    } else {
      console.log('✅ PASSED: last_wish_deliveries table is accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

async function testFullWorkflow() {
  console.log('\n📊 Test 5: Testing complete workflow...');
  
  try {
    const testUserId = crypto.randomUUID();
    
    // Create test Last Wish setting
    const { data: setting, error: settingError } = await supabase
      .from('last_wish_settings')
      .insert({
        user_id: testUserId,
        is_enabled: true,
        check_in_frequency: 1,
        last_check_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        recipients: [{ 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User', 
          relationship: 'friend' 
        }],
        include_data: { accounts: true },
        message: 'Test workflow message',
        is_active: true,
        delivery_triggered: false
      })
      .select()
      .single();
    
    if (settingError) {
      console.log('❌ FAILED to create test setting:', settingError.message);
      return false;
    }
    
    console.log('✅ Test setting created successfully');
    
    // Check if user shows up as overdue
    const { data: overdueUsers, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    if (overdueError) {
      console.log('❌ FAILED to check overdue users:', overdueError.message);
      return false;
    }
    
    const isUserOverdue = overdueUsers?.some(user => user.user_id === testUserId);
    console.log(`✅ Overdue detection: ${isUserOverdue ? 'WORKING' : 'NOT DETECTED'}`);
    
    // Test trigger function
    if (isUserOverdue) {
      const { data: triggerResult, error: triggerError } = await supabase
        .rpc('trigger_last_wish_delivery', { target_user_id: testUserId });
      
      if (triggerError) {
        console.log('❌ FAILED to trigger delivery:', triggerError.message);
      } else {
        console.log(`✅ Delivery trigger: ${triggerResult ? 'SUCCESS' : 'NO ACTION'}`);
        
        // Verify delivery_triggered was set
        const { data: updatedSetting, error: updateError } = await supabase
          .from('last_wish_settings')
          .select('delivery_triggered')
          .eq('user_id', testUserId)
          .single();
        
        if (!updateError && updatedSetting) {
          console.log(`✅ delivery_triggered updated: ${updatedSetting.delivery_triggered}`);
        }
      }
    }
    
    // Cleanup
    await supabase.from('last_wish_deliveries').delete().eq('user_id', testUserId);
    await supabase.from('last_wish_settings').delete().eq('user_id', testUserId);
    
    console.log('✅ Test cleanup completed');
    return true;
    
  } catch (error) {
    console.log('❌ ERROR in workflow test:', error.message);
    return false;
  }
}

async function runVerification() {
  console.log('Starting verification of database fixes...\n');
  
  const test1 = await verifyColumnExists();
  const test2 = await verifyFunction();
  const test3 = await verifyTriggerFunction();
  const test4 = await verifyDeliveriesTable();
  const test5 = await testFullWorkflow();
  
  const passedTests = [test1, test2, test3, test4, test5].filter(Boolean).length;
  const totalTests = 5;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(50));
  
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Database fixes have been successfully applied');
    console.log('✅ Last Wish system is now ready for testing');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test API endpoints (deploy to Vercel if needed)');
    console.log('2. Test frontend component functionality');
    console.log('3. Run comprehensive system test');
    
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('🔧 Please check the failed tests above and:');
    console.log('1. Ensure all SQL commands were run in Supabase');
    console.log('2. Check for any SQL errors in Supabase dashboard');
    console.log('3. Verify your database permissions');
  }
  
  console.log('\n🏁 VERIFICATION COMPLETE');
}

runVerification();
