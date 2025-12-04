import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestTransaction() {
  console.log('=== CREATING TEST TRANSACTION ===\n');
  
  try {
    // Step 1: Get an account to use
    console.log('1. Getting an account...');
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);
    
    if (accountError || !accounts || accounts.length === 0) {
      console.log('❌ No accounts found. Creating a test account...');
      
      const { data: newAccount, error: createAccountError } = await supabase
        .from('accounts')
        .insert({
          name: 'Test Account',
          balance: 1000,
          currency: 'USD'
        })
        .select()
        .single();
      
      if (createAccountError) {
        console.log('❌ Cannot create account:', createAccountError.message);
        return;
      }
      
      console.log('✅ Created test account');
    } else {
      console.log('✅ Using existing account');
    }
    
    const accountId = accounts?.[0]?.id || (await supabase.from('accounts').select('id').limit(1).single()).data.id;
    
    // Step 2: Create a test transaction
    console.log('\n2. Creating test transaction...');
    const testTransactionId = 'F' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        transaction_id: testTransactionId,
        account_id: accountId,
        amount: 50.00,
        description: 'Test transaction for trigger',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (transactionError) {
      console.log('❌ Cannot create transaction:', transactionError.message);
      return;
    }
    
    console.log('✅ Created test transaction');
    console.log(`   Transaction ID: ${transaction.transaction_id}`);
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
    const newDescription = 'Test transaction UPDATED ' + Date.now();
    
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
    
    // Step 7: Clean up
    console.log('\n7. Cleaning up test data...');
    await supabase
      .from('transactions')
      .delete()
      .eq('transaction_id', transaction.transaction_id);
    
    console.log('✅ Test transaction deleted');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestTransaction(); 