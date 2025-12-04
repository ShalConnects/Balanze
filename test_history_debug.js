import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHistoryDebug() {
  console.log('=== HISTORY TRACKING DEBUG TEST ===\n');
  
  try {
    // Step 1: Check if history table exists
    console.log('1. Checking if history table exists...');
    const { data: historyCheck, error: historyError } = await supabase
      .from('transaction_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.log('❌ History table error:', historyError.message);
      console.log('   You need to run fix_history_debug.sql first');
      return;
    }
    console.log('✅ History table exists');
    
    // Step 2: Get a test transaction
    console.log('\n2. Getting a test transaction...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description, amount, category')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found:', tError?.message || 'No data');
      return;
    }
    
    const testTransaction = transactions[0];
    console.log(`✅ Found test transaction: ${testTransaction.transaction_id}`);
    console.log(`   Description: "${testTransaction.description}"`);
    console.log(`   Amount: ${testTransaction.amount}`);
    console.log(`   Category: "${testTransaction.category}"`);
    
    // Step 3: Check current history count
    console.log('\n3. Checking current history count...');
    const { data: currentHistory, error: hError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (hError) {
      console.log('❌ Cannot check history:', hError.message);
      return;
    }
    
    const initialHistoryCount = currentHistory?.length || 0;
    console.log(`✅ Current history records: ${initialHistoryCount}`);
    
    // Step 4: Make a test edit
    console.log('\n4. Making a test edit...');
    const originalDescription = testTransaction.description;
    const testDescription = originalDescription + ' (DEBUG TEST ' + Date.now() + ')';
    
    console.log(`   Changing description from: "${originalDescription}"`);
    console.log(`   To: "${testDescription}"`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('transactions')
      .update({ description: testDescription })
      .eq('transaction_id', testTransaction.transaction_id)
      .select();
    
    if (updateError) {
      console.log('❌ Cannot update transaction:', updateError.message);
      return;
    }
    
    console.log('✅ Successfully updated transaction');
    
    // Step 5: Wait and check for new history
    console.log('\n5. Waiting for history to be recorded...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: newHistory, error: nhError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id)
      .order('changed_at', { ascending: false });
    
    if (nhError) {
      console.log('❌ Cannot check new history:', nhError.message);
    } else {
      const newHistoryCount = newHistory?.length || 0;
      console.log(`✅ New history records: ${newHistoryCount}`);
      
      if (newHistoryCount > initialHistoryCount) {
        console.log('🎉 HISTORY TRACKING IS WORKING!');
        
        // Show the new records
        const newRecords = newHistory.slice(0, newHistoryCount - initialHistoryCount);
        console.log('\nNew history records:');
        newRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
          console.log(`      Changed at: ${record.changed_at}`);
        });
      } else {
        console.log('❌ HISTORY TRACKING IS NOT WORKING');
        console.log('   No new history records were created');
        console.log('   This means the trigger is not firing');
      }
    }
    
    // Step 6: Check trigger status
    console.log('\n6. Checking trigger status...');
    const { data: triggerCheck, error: triggerError } = await supabase
      .rpc('check_trigger_status', {})
      .catch(() => ({ data: null, error: { message: 'Function not available' } }));
    
    if (triggerError) {
      console.log('❌ Cannot check trigger status:', triggerError.message);
      console.log('   You can check manually in Supabase SQL Editor:');
      console.log('   SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE trigger_name = \'trigger_log_transaction_changes\';');
    } else {
      console.log('✅ Trigger status:', triggerCheck);
    }
    
    // Step 7: Revert the test change
    console.log('\n7. Reverting test change...');
    const { error: revertError } = await supabase
      .from('transactions')
      .update({ description: originalDescription })
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (revertError) {
      console.log('❌ Cannot revert test change:', revertError.message);
    } else {
      console.log('✅ Reverted test change');
    }
    
    // Step 8: Final summary
    console.log('\n=== FINAL SUMMARY ===');
    if (newHistoryCount > initialHistoryCount) {
      console.log('✅ HISTORY TRACKING IS WORKING CORRECTLY');
      console.log('   The trigger is firing and recording changes');
    } else {
      console.log('❌ HISTORY TRACKING IS NOT WORKING');
      console.log('   Possible issues:');
      console.log('   1. Trigger not created properly');
      console.log('   2. Function not working');
      console.log('   3. Permissions issue');
      console.log('   4. RLS blocking the insert');
      console.log('   Check the Supabase logs for DEBUG messages');
    }
    
  } catch (error) {
    console.error('Error in debug test:', error);
  }
}

testHistoryDebug(); 