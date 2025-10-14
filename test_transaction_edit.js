import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTransactionEdit() {
  console.log('Testing transaction editing functionality...\n');
  
  try {
    // First, let's get a sample transaction
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.log('❌ Error fetching transactions:', fetchError.message);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('❌ No transactions found');
      return;
    }
    
    const transaction = transactions[0];
    console.log('✅ Found transaction:', {
      id: transaction.id,
      transaction_id: transaction.transaction_id,
      amount: transaction.amount,
      type: transaction.type
    });
    
    // Test 1: Try to update the transaction
    console.log('\n--- Test 1: Updating transaction ---');
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({ 
        amount: transaction.amount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating transaction:', updateError.message);
    } else {
      console.log('✅ Transaction updated successfully');
    }
    
    // Test 2: Try to find related purchases
    console.log('\n--- Test 2: Finding related purchases ---');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('transaction_id', transaction.transaction_id);
    
    if (purchasesError) {
      console.log('❌ Error finding purchases:', purchasesError.message);
    } else {
      console.log(`✅ Found ${purchases?.length || 0} related purchases`);
    }
    
    // Test 3: Try to find purchases by transaction UUID
    console.log('\n--- Test 3: Finding purchases by transaction UUID ---');
    const { data: purchasesByUUID, error: uuidError } = await supabase
      .from('purchases')
      .select('*')
      .eq('transaction_id', transaction.id);
    
    if (uuidError) {
      console.log('❌ Error finding purchases by UUID:', uuidError.message);
    } else {
      console.log(`✅ Found ${purchasesByUUID?.length || 0} purchases by UUID`);
    }
    
    // Test 4: Check if purchases table has transaction_id column
    console.log('\n--- Test 4: Checking purchases table structure ---');
    const { data: purchaseSample, error: sampleError } = await supabase
      .from('purchases')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error accessing purchases table:', sampleError.message);
    } else {
      console.log('✅ Purchases table accessible');
      if (purchaseSample && purchaseSample.length > 0) {
        const columns = Object.keys(purchaseSample[0]);
        console.log('Available columns:', columns);
        console.log('Has transaction_id:', columns.includes('transaction_id'));
        if (columns.includes('transaction_id')) {
          console.log('Sample transaction_id value:', purchaseSample[0].transaction_id);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testTransactionEdit(); 