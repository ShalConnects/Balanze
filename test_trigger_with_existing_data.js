import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTriggerWithExistingData() {
  console.log('=== TESTING TRIGGER WITH EXISTING DATA ===\n');
  
  try {
    // Step 1: Check what tables have data
    console.log('1. Checking available data...');
    
    const tables = ['transactions', 'purchases', 'accounts'];
    let foundData = false;
    
    for (const tableName of tables) {
      console.log(`   Checking ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        console.log(`   ✅ ${tableName} has data`);
        foundData = true;
        
        if (tableName === 'transactions') {
          console.log(`   Sample transaction: ${JSON.stringify(data[0], null, 2)}`);
        }
      } else {
        console.log(`   ❌ ${tableName} has no data or error: ${error?.message || 'empty'}`);
      }
    }
    
    if (!foundData) {
      console.log('\n❌ No data found in any table.');
      console.log('Please create some transactions in your app first, then run this test.');
      return;
    }
    
    // Step 2: Try to get a transaction
    console.log('\n2. Getting a transaction...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found');
      console.log('Please create a transaction in your app first.');
      return;
    }
    
    const transaction = transactions[0];
    console.log(`✅ Found transaction: ${transaction.transaction_id}`);
    console.log(`   Description: "${transaction.description}"`);
    
    // Step 3: Count history records before
    console.log('\n3. Counting history records before...');
    const { data: beforeHistory, error: beforeError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', transaction.transaction_id);
    
    if (beforeError) {
      console.log('❌ Cannot count history:', beforeError.message);
      return;
    }
    
    const beforeCount = beforeHistory?.length || 0;
    console.log(`✅ History records before: ${beforeCount}`);
    
    // Step 4: Update the transaction
    console.log('\n4. Updating transaction...');
    const newDescription = transaction.description + ' (TEST ' + Date.now() + ')';
    
    const { data: updateResult, error: updateError } = await supabase
      .from('transactions')
      .update({ description: newDescription })
      .eq('transaction_id', transaction.transaction_id);
    
    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
      return;
    }
    
    console.log('✅ Transaction updated');
    console.log(`   New description: "${newDescription}"`);
    
    // Step 5: Wait and check history
    console.log('\n5. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: afterHistory, error: afterError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', transaction.transaction_id)
      .order('changed_at', { ascending: false });
    
    if (afterError) {
      console.log('❌ Cannot check after history:', afterError.message);
      return;
    }
    
    const afterCount = afterHistory?.length || 0;
    console.log(`✅ History records after: ${afterCount}`);
    
    // Step 6: Show results
    if (afterCount > beforeCount) {
      console.log('🎉 SUCCESS! Trigger is working!');
      
      const newRecords = afterHistory.slice(0, afterCount - beforeCount);
      console.log('\nNew records:');
      newRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
      });
    } else {
      console.log('❌ FAILURE! No new history records.');
      console.log('   The trigger exists but is not working.');
      
      // Let's check if we can insert manually
      console.log('\n6. Testing manual insert...');
      const { data: manualInsert, error: manualError } = await supabase
        .from('transaction_history')
        .insert({
          transaction_id: transaction.transaction_id,
          field_name: 'manual_test',
          old_value: 'test_old',
          new_value: 'test_new'
        })
        .select();
      
      if (manualError) {
        console.log('❌ Manual insert failed:', manualError.message);
        console.log('   This suggests a permissions or RLS issue.');
      } else {
        console.log('✅ Manual insert worked');
        console.log('   The issue is with the trigger function, not the table.');
      }
    }
    
    // Step 7: Revert
    console.log('\n7. Reverting change...');
    await supabase
      .from('transactions')
      .update({ description: transaction.description })
      .eq('transaction_id', transaction.transaction_id);
    
    console.log('✅ Change reverted');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTriggerWithExistingData(); 