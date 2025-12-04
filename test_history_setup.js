import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHistorySetup() {
  console.log('Testing history tracking setup...\n');
  
  try {
    // Test 1: Check if we can access transactions
    console.log('1. Testing transactions table access...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description, amount')
      .limit(1);
    
    if (tError) {
      console.log('❌ Cannot access transactions:', tError.message);
      return;
    }
    console.log('✅ Can access transactions');
    
    // Test 2: Check if history tables exist
    console.log('\n2. Testing history tables...');
    
    // Try to access old history tables
    const { data: oldHistory, error: oldError } = await supabase
      .from('transaction_updates')
      .select('*')
      .limit(1);
    
    if (oldError) {
      console.log('❌ Old history tables not accessible:', oldError.message);
    } else {
      console.log('✅ Old history tables exist');
    }
    
    // Try to access new history tables
    const { data: newHistory, error: newError } = await supabase
      .from('transaction_edit_sessions')
      .select('*')
      .limit(1);
    
    if (newError) {
      console.log('❌ New history tables not accessible:', newError.message);
    } else {
      console.log('✅ New history tables exist');
    }
    
    // Test 3: Check if we can edit a transaction to trigger history
    console.log('\n3. Testing transaction edit to trigger history...');
    
    if (transactions && transactions.length > 0) {
      const testTransaction = transactions[0];
      console.log(`Testing with transaction: ${testTransaction.transaction_id}`);
      
      // Try to update the transaction
      const { data: updateResult, error: updateError } = await supabase
        .from('transactions')
        .update({ description: testTransaction.description + ' (test)' })
        .eq('transaction_id', testTransaction.transaction_id)
        .select();
      
      if (updateError) {
        console.log('❌ Cannot update transaction:', updateError.message);
      } else {
        console.log('✅ Successfully updated transaction');
        
        // Check if history was recorded
        setTimeout(async () => {
          console.log('\n4. Checking if history was recorded...');
          
          // Check old history
          const { data: oldRecords, error: oldCheckError } = await supabase
            .from('transaction_updates')
            .select('*')
            .eq('transaction_id', testTransaction.transaction_id)
            .order('updated_at', { ascending: false })
            .limit(5);
          
          if (oldCheckError) {
            console.log('❌ Cannot check old history:', oldCheckError.message);
          } else {
            console.log(`✅ Old history records: ${oldRecords?.length || 0}`);
          }
          
          // Check new history
          const { data: newRecords, error: newCheckError } = await supabase
            .from('transaction_edit_sessions')
            .select('*')
            .eq('transaction_id', testTransaction.transaction_id)
            .order('edited_at', { ascending: false })
            .limit(5);
          
          if (newCheckError) {
            console.log('❌ Cannot check new history:', newCheckError.message);
          } else {
            console.log(`✅ New history records: ${newRecords?.length || 0}`);
          }
          
          // Revert the test change
          const { error: revertError } = await supabase
            .from('transactions')
            .update({ description: testTransaction.description })
            .eq('transaction_id', testTransaction.transaction_id);
          
          if (revertError) {
            console.log('❌ Cannot revert test change:', revertError.message);
          } else {
            console.log('✅ Reverted test change');
          }
          
          console.log('\n--- DIAGNOSIS ---');
          if ((oldRecords?.length || 0) > 0 || (newRecords?.length || 0) > 0) {
            console.log('✅ History tracking is working!');
          } else {
            console.log('❌ History tracking is NOT working');
            console.log('You need to run the improve_history_tracking_system.sql script');
          }
        }, 2000);
      }
    }
    
  } catch (error) {
    console.error('Error testing history setup:', error);
  }
}

testHistorySetup(); 