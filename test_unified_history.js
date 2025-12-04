import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUnifiedHistory() {
  console.log('=== TESTING UNIFIED HISTORY SYSTEM ===\n');
  
  try {
    // Step 1: Check if activity_history table exists
    console.log('1. Checking activity_history table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('activity_history')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ activity_history table not found:', tableError.message);
      return;
    }
    
    console.log('✅ activity_history table exists');
    
    // Step 2: Get existing data
    console.log('\n2. Getting existing data...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description')
      .limit(1);
    
    const { data: purchases, error: pError } = await supabase
      .from('purchases')
      .select('id, item_name')
      .limit(1);
    
    if (tError || !transactions || transactions.length === 0) {
      console.log('❌ No transactions found');
      return;
    }
    
    if (pError || !purchases || purchases.length === 0) {
      console.log('❌ No purchases found');
      return;
    }
    
    const transaction = transactions[0];
    const purchase = purchases[0];
    
    console.log(`✅ Found transaction: ${transaction.transaction_id}`);
    console.log(`✅ Found purchase: ${purchase.id}`);
    
    // Step 3: Count history before
    console.log('\n3. Counting history before...');
    const { data: beforeHistory, error: beforeError } = await supabase
      .from('activity_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (beforeError) {
      console.log('❌ Cannot count history:', beforeError.message);
      return;
    }
    
    const beforeCount = beforeHistory?.length || 0;
    console.log(`✅ History records before: ${beforeCount}`);
    
    // Step 4: Update transaction
    console.log('\n4. Updating transaction...');
    const newTransactionDesc = transaction.description + ' (UNIFIED TEST ' + Date.now() + ')';
    
    const { error: updateTransactionError } = await supabase
      .from('transactions')
      .update({ description: newTransactionDesc })
      .eq('transaction_id', transaction.transaction_id);
    
    if (updateTransactionError) {
      console.log('❌ Transaction update failed:', updateTransactionError.message);
    } else {
      console.log('✅ Transaction updated');
    }
    
    // Step 5: Update purchase
    console.log('\n5. Updating purchase...');
    const newPurchaseTitle = purchase.item_name + ' (UNIFIED TEST ' + Date.now() + ')';
    
    const { error: updatePurchaseError } = await supabase
      .from('purchases')
      .update({ item_name: newPurchaseTitle })
      .eq('id', purchase.id);
    
    if (updatePurchaseError) {
      console.log('❌ Purchase update failed:', updatePurchaseError.message);
    } else {
      console.log('✅ Purchase updated');
    }
    
    // Step 6: Wait and check history
    console.log('\n6. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: afterHistory, error: afterError } = await supabase
      .from('activity_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (afterError) {
      console.log('❌ Cannot check after history:', afterError.message);
      return;
    }
    
    const afterCount = afterHistory?.length || 0;
    console.log(`✅ History records after: ${afterCount}`);
    
    // Step 7: Show results
    if (afterCount > beforeCount) {
      console.log('🎉 SUCCESS! Unified history is working!');
      
      const newRecords = afterHistory.slice(0, afterCount - beforeCount);
      console.log('\nNew records:');
      newRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.activity_type} | ${record.entity_type} | ${record.entity_id}`);
        console.log(`   Description: ${record.description}`);
        console.log(`   Changes: ${JSON.stringify(record.changes, null, 2)}`);
        console.log(`   Time: ${record.created_at}`);
      });
    } else {
      console.log('❌ FAILURE! No new history records.');
      console.log('   The unified history system may not be working.');
    }
    
    // Step 8: Show sample of all history
    console.log('\n7. Sample of all history records:');
    const { data: allHistory, error: allError } = await supabase
      .from('activity_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!allError && allHistory && allHistory.length > 0) {
      allHistory.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.activity_type} | ${record.entity_type} | ${record.entity_id}`);
        console.log(`   Description: ${record.description}`);
        if (record.changes && record.changes.summary) {
          console.log(`   Summary: ${record.changes.summary}`);
          if (record.changes.changes) {
            record.changes.changes.forEach(change => {
              console.log(`     ${change.field}: "${change.old}" → "${change.new}"`);
            });
          }
        }
        console.log(`   Time: ${record.created_at}`);
      });
    }
    
    // Step 9: Revert changes
    console.log('\n8. Reverting changes...');
    
    await supabase
      .from('transactions')
      .update({ description: transaction.description })
      .eq('transaction_id', transaction.transaction_id);
    
    await supabase
      .from('purchases')
      .update({ item_name: purchase.item_name })
      .eq('id', purchase.id);
    
    console.log('✅ Changes reverted');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUnifiedHistory(); 