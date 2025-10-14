import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllFixes() {
  console.log('=== TESTING ALL FIXES ===\n');
  
  try {
    // Step 1: Get existing data
    console.log('1. Getting existing data...');
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('transaction_id, description')
      .limit(1);
    
    const { data: purchases, error: pError } = await supabase
      .from('purchases')
      .select('id, item_name, transaction_id')
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
    
    // Step 2: Test purchase title sync
    console.log('\n2. Testing purchase title sync...');
    const originalPurchaseTitle = purchase.item_name;
    const newPurchaseTitle = originalPurchaseTitle + ' (SYNC TEST ' + Date.now() + ')';
    
    const { error: updatePurchaseError } = await supabase
      .from('purchases')
      .update({ item_name: newPurchaseTitle })
      .eq('id', purchase.id);
    
    if (updatePurchaseError) {
      console.log('❌ Purchase update failed:', updatePurchaseError.message);
    } else {
      console.log('✅ Purchase updated');
      
      // Wait and check if transaction description synced
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: updatedTransaction, error: checkError } = await supabase
        .from('transactions')
        .select('description')
        .eq('transaction_id', purchase.transaction_id)
        .single();
      
      if (checkError) {
        console.log('❌ Cannot check transaction sync:', checkError.message);
      } else if (updatedTransaction.description === newPurchaseTitle) {
        console.log('✅ Title sync working! Transaction description updated');
      } else {
        console.log('❌ Title sync failed. Transaction description:', updatedTransaction.description);
      }
    }
    
    // Step 3: Test transaction history
    console.log('\n3. Testing transaction history...');
    const originalTransactionDesc = transaction.description;
    const newTransactionDesc = originalTransactionDesc + ' (HISTORY TEST ' + Date.now() + ')';
    
    // Count history before
    const { data: beforeHistory, error: beforeError } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', transaction.transaction_id);
    
    const beforeCount = beforeHistory?.length || 0;
    console.log(`   History records before: ${beforeCount}`);
    
    // Update transaction
    const { error: updateTransactionError } = await supabase
      .from('transactions')
      .update({ description: newTransactionDesc })
      .eq('transaction_id', transaction.transaction_id);
    
    if (updateTransactionError) {
      console.log('❌ Transaction update failed:', updateTransactionError.message);
    } else {
      console.log('✅ Transaction updated');
      
      // Wait and check history
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: afterHistory, error: afterError } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('transaction_id', transaction.transaction_id)
        .order('changed_at', { ascending: false });
      
      const afterCount = afterHistory?.length || 0;
      console.log(`   History records after: ${afterCount}`);
      
      if (afterCount > beforeCount) {
        console.log('✅ Transaction history working!');
        const newRecords = afterHistory.slice(0, afterCount - beforeCount);
        newRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
        });
      } else {
        console.log('❌ Transaction history not working');
      }
    }
    
    // Step 4: Test purchase history
    console.log('\n4. Testing purchase history...');
    
    // Count purchase history before
    const { data: beforePurchaseHistory, error: beforePurchaseError } = await supabase
      .from('purchase_updates')
      .select('*')
      .eq('purchase_id', purchase.id);
    
    const beforePurchaseCount = beforePurchaseHistory?.length || 0;
    console.log(`   Purchase history records before: ${beforePurchaseCount}`);
    
    // Update purchase
    const newPurchaseTitle2 = newPurchaseTitle + ' (HISTORY TEST)';
    const { error: updatePurchase2Error } = await supabase
      .from('purchases')
      .update({ item_name: newPurchaseTitle2 })
      .eq('id', purchase.id);
    
    if (updatePurchase2Error) {
      console.log('❌ Purchase update failed:', updatePurchase2Error.message);
    } else {
      console.log('✅ Purchase updated');
      
      // Wait and check purchase history
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: afterPurchaseHistory, error: afterPurchaseError } = await supabase
        .from('purchase_updates')
        .select('*')
        .eq('purchase_id', purchase.id)
        .order('updated_at', { ascending: false });
      
      const afterPurchaseCount = afterPurchaseHistory?.length || 0;
      console.log(`   Purchase history records after: ${afterPurchaseCount}`);
      
      if (afterPurchaseCount > beforePurchaseCount) {
        console.log('✅ Purchase history working!');
        const newRecords = afterPurchaseHistory.slice(0, afterPurchaseCount - beforePurchaseCount);
        newRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
        });
      } else {
        console.log('❌ Purchase history not working');
      }
    }
    
    // Step 5: Test general activity history
    console.log('\n5. Testing general activity history...');
    
    const { data: activityHistory, error: activityError } = await supabase
      .from('activity_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (activityError) {
      console.log('❌ Cannot check activity history:', activityError.message);
    } else {
      console.log(`✅ Found ${activityHistory?.length || 0} activity records`);
      if (activityHistory && activityHistory.length > 0) {
        console.log('Recent activities:');
        activityHistory.forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.activity_type} ${activity.entity_type}: ${activity.description}`);
        });
      }
    }
    
    // Step 6: Revert changes
    console.log('\n6. Reverting changes...');
    
    await supabase
      .from('transactions')
      .update({ description: originalTransactionDesc })
      .eq('transaction_id', transaction.transaction_id);
    
    await supabase
      .from('purchases')
      .update({ item_name: originalPurchaseTitle })
      .eq('id', purchase.id);
    
    console.log('✅ Changes reverted');
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('1. Purchase title sync: ' + (updatePurchaseError ? '❌' : '✅'));
    console.log('2. Transaction history: ' + (afterCount > beforeCount ? '✅' : '❌'));
    console.log('3. Purchase history: ' + (afterPurchaseCount > beforePurchaseCount ? '✅' : '❌'));
    console.log('4. Activity history: ' + (activityError ? '❌' : '✅'));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAllFixes(); 