import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHistoryManual() {
  console.log('=== MANUAL HISTORY TEST ===\n');
  
  try {
    // Step 1: Check if history table exists
    console.log('1. Checking history table...');
    const { data: historyTable, error: tableError } = await supabase
      .from('transaction_history')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ History table does not exist:', tableError.message);
      console.log('   Run fix_history_working_now.sql first!');
      return;
    }
    console.log('✅ History table exists');
    
    // Step 2: Get a transaction to test with
    console.log('\n2. Getting a test transaction...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description, amount, category')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found');
      return;
    }
    
    const testTransaction = transactions[0];
    console.log(`✅ Found transaction: ${testTransaction.transaction_id}`);
    console.log(`   Description: "${testTransaction.description}"`);
    console.log(`   Amount: ${testTransaction.amount}`);
    
    // Step 3: Count current history records
    console.log('\n3. Counting current history records...');
    const { data: currentHistory, error: hError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (hError) {
      console.log('❌ Cannot count history:', hError.message);
      return;
    }
    
    const beforeCount = currentHistory?.length || 0;
    console.log(`✅ Current history records: ${beforeCount}`);
    
    // Step 4: Make a change
    console.log('\n4. Making a change to the transaction...');
    const newDescription = testTransaction.description + ' (TEST ' + Date.now() + ')';
    
    const { data: updateResult, error: updateError } = await supabase
      .from('transactions')
      .update({ description: newDescription })
      .eq('transaction_id', testTransaction.transaction_id)
      .select();
    
    if (updateError) {
      console.log('❌ Cannot update transaction:', updateError.message);
      return;
    }
    
    console.log('✅ Transaction updated successfully');
    console.log(`   Changed description to: "${newDescription}"`);
    
    // Step 5: Wait and check for new history records
    console.log('\n5. Waiting 3 seconds for trigger to fire...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: newHistory, error: nhError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id)
      .order('changed_at', { ascending: false });
    
    if (nhError) {
      console.log('❌ Cannot check new history:', nhError.message);
      return;
    }
    
    const afterCount = newHistory?.length || 0;
    console.log(`✅ History records after update: ${afterCount}`);
    
    // Step 6: Show results
    if (afterCount > beforeCount) {
      console.log('🎉 SUCCESS! History tracking is working!');
      
      const newRecords = newHistory.slice(0, afterCount - beforeCount);
      console.log('\nNew history records:');
      newRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. Field: ${record.field_name}`);
        console.log(`      Old: "${record.old_value}"`);
        console.log(`      New: "${record.new_value}"`);
        console.log(`      Time: ${record.changed_at}`);
      });
    } else {
      console.log('❌ FAILURE! No history was recorded.');
      console.log('   This means the trigger is not working.');
      console.log('   Possible issues:');
      console.log('   1. Trigger not created');
      console.log('   2. Function not working');
      console.log('   3. Permissions issue');
    }
    
    // Step 7: Revert the change
    console.log('\n6. Reverting the change...');
    const { error: revertError } = await supabase
      .from('transactions')
      .update({ description: testTransaction.description })
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (revertError) {
      console.log('❌ Cannot revert:', revertError.message);
    } else {
      console.log('✅ Change reverted');
    }
    
    // Step 8: Final summary
    console.log('\n=== FINAL RESULT ===');
    if (afterCount > beforeCount) {
      console.log('✅ HISTORY TRACKING IS WORKING!');
      console.log('   The trigger is firing and recording changes.');
      console.log('   You can now edit transactions and see history.');
    } else {
      console.log('❌ HISTORY TRACKING IS NOT WORKING');
      console.log('   The trigger is not firing when you update transactions.');
      console.log('   Check if you ran fix_history_working_now.sql properly.');
    }
    
  } catch (error) {
    console.error('Error in manual test:', error);
  }
}

testHistoryManual(); 