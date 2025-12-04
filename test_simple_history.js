import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleHistory() {
  console.log('Testing simple history tracking...\n');
  
  try {
    // Step 1: Get a test transaction
    console.log('1. Getting a test transaction...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description, amount, category')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found to test with');
      return;
    }
    
    const testTransaction = transactions[0];
    console.log(`✅ Found test transaction: ${testTransaction.transaction_id}`);
    console.log(`   Description: ${testTransaction.description}`);
    console.log(`   Amount: ${testTransaction.amount}`);
    
    // Step 2: Check current history count
    console.log('\n2. Checking current history count...');
    const { data: currentHistory, error: hError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (hError) {
      console.log('❌ Cannot access history table:', hError.message);
      console.log('   You need to run fix_history_tracking_simple.sql first');
      return;
    }
    
    const initialHistoryCount = currentHistory?.length || 0;
    console.log(`✅ Current history records: ${initialHistoryCount}`);
    
    // Step 3: Make a test edit
    console.log('\n3. Making a test edit...');
    const originalDescription = testTransaction.description;
    const testDescription = originalDescription + ' (SIMPLE TEST ' + Date.now() + ')';
    
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
    
    // Step 4: Wait a moment and check if history was recorded
    console.log('\n4. Waiting for history to be recorded...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
        console.log('🎉 SIMPLE HISTORY TRACKING IS WORKING!');
        
        // Show the latest history records
        const newRecords = newHistory.slice(0, newHistoryCount - initialHistoryCount);
        console.log('\nNew history records:');
        newRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
          console.log(`      Changed at: ${record.changed_at}`);
        });
      } else {
        console.log('❌ SIMPLE HISTORY TRACKING IS NOT WORKING');
        console.log('   No new history records were created');
        console.log('   This might be a trigger issue');
      }
    }
    
    // Step 5: Test the view
    console.log('\n5. Testing history view...');
    const { data: historyView, error: viewError } = await supabase
      .from('transaction_history_view')
      .select('*')
      .eq('transaction_id', testTransaction.transaction_id)
      .order('changed_at', { ascending: false })
      .limit(5);
    
    if (viewError) {
      console.log('❌ Cannot access history view:', viewError.message);
    } else {
      console.log(`✅ History view accessible, showing ${historyView?.length || 0} records`);
      if (historyView && historyView.length > 0) {
        console.log('Latest view record:', historyView[0]);
      }
    }
    
    // Step 6: Revert the test change
    console.log('\n6. Reverting test change...');
    const { error: revertError } = await supabase
      .from('transactions')
      .update({ description: originalDescription })
      .eq('transaction_id', testTransaction.transaction_id);
    
    if (revertError) {
      console.log('❌ Cannot revert test change:', revertError.message);
    } else {
      console.log('✅ Reverted test change');
    }
    
    // Step 7: Final summary
    console.log('\n=== FINAL SUMMARY ===');
    if (newHistoryCount > initialHistoryCount) {
      console.log('✅ SIMPLE HISTORY TRACKING IS WORKING CORRECTLY');
      console.log('   You can now edit transactions and see the history');
      console.log('   Check the transaction_history table or transaction_history_view');
      console.log('   Each field change creates a separate record');
    } else {
      console.log('❌ SIMPLE HISTORY TRACKING IS NOT WORKING');
      console.log('   You need to run fix_history_tracking_simple.sql');
      console.log('   in your Supabase SQL Editor');
    }
    
  } catch (error) {
    console.error('Error testing simple history:', error);
  }
}

testSimpleHistory(); 