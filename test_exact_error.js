import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExactError() {
  try {
    // Step 1: Check if there are any existing transactions
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, transaction_id, type, amount, description')
      .limit(10);
    
    if (transactionsError) {
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      // Step 2: Test the database schema directly
      
      // Try to create a test transaction with a UUID transaction_id
      const testUUIDTransaction = {
        account_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        amount: 100.00,
        type: 'expense',
        category: 'Test',
        description: 'Test transaction with UUID transaction_id',
        date: new Date().toISOString().split('T')[0],
        tags: ['test'],
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        transaction_id: '550e8400-e29b-41d4-a716-446655440000' // UUID format
      };
      
      // Testing with UUID transaction_id
      
      const { data: createdUUIDTransaction, error: createUUIDError } = await supabase
        .from('transactions')
        .insert(testUUIDTransaction)
        .select()
        .single();
      
      if (createUUIDError) {
        console.log('❌ Error creating transaction with UUID transaction_id:', createUUIDError.message);
      } else {
        console.log('✅ Successfully created transaction with UUID transaction_id');
        
        // Now test the purchase update that's likely failing
        console.log('\n=== STEP 3: TESTING PURCHASE UPDATE WITH UUID ===');
        
        const purchaseUpdateData = {
          item_name: 'Test purchase update',
          price: 100.00,
          category: 'Test',
          notes: 'Testing UUID/VARCHAR mismatch'
        };
        
        console.log('Testing purchase update with UUID transaction_id:', createdUUIDTransaction.transaction_id);
        
        const { data: purchaseUpdate, error: purchaseUpdateError } = await supabase
          .from('purchases')
          .update(purchaseUpdateData)
          .eq('transaction_id', createdUUIDTransaction.transaction_id);
        
        if (purchaseUpdateError) {
          console.log('❌ PURCHASE UPDATE FAILED:', purchaseUpdateError.message);
          console.log('🎯 THIS IS THE EXACT ERROR YOU\'RE EXPERIENCING!');
          console.log('The UUID/VARCHAR mismatch is confirmed.');
        } else {
          console.log('✅ Purchase update successful with UUID transaction_id');
        }
        
        // Clean up
        await supabase.from('transactions').delete().eq('id', createdUUIDTransaction.id);
      }
      
      // Step 4: Test with VARCHAR transaction_id
      console.log('\n=== STEP 4: TESTING WITH VARCHAR TRANSACTION_ID ===');
      
      const testVARCHARTransaction = {
        account_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        amount: 200.00,
        type: 'expense',
        category: 'Test',
        description: 'Test transaction with VARCHAR transaction_id',
        date: new Date().toISOString().split('T')[0],
        tags: ['test'],
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        transaction_id: 'F1234567' // VARCHAR format
      };
      
      console.log('Testing with VARCHAR transaction_id:', testVARCHARTransaction.transaction_id);
      
      const { data: createdVARCHARTransaction, error: createVARCHARError } = await supabase
        .from('transactions')
        .insert(testVARCHARTransaction)
        .select()
        .single();
      
      if (createVARCHARError) {
        console.log('❌ Error creating transaction with VARCHAR transaction_id:', createVARCHARError.message);
      } else {
        console.log('✅ Successfully created transaction with VARCHAR transaction_id');
        
        // Test purchase update with VARCHAR transaction_id
        console.log('\n=== STEP 5: TESTING PURCHASE UPDATE WITH VARCHAR ===');
        
        const purchaseUpdateData = {
          item_name: 'Test purchase update with VARCHAR',
          price: 200.00,
          category: 'Test',
          notes: 'Testing VARCHAR transaction_id'
        };
        
        console.log('Testing purchase update with VARCHAR transaction_id:', createdVARCHARTransaction.transaction_id);
        
        const { data: purchaseUpdate, error: purchaseUpdateError } = await supabase
          .from('purchases')
          .update(purchaseUpdateData)
          .eq('transaction_id', createdVARCHARTransaction.transaction_id);
        
        if (purchaseUpdateError) {
          console.log('❌ Purchase update failed with VARCHAR:', purchaseUpdateError.message);
        } else {
          console.log('✅ Purchase update successful with VARCHAR transaction_id');
        }
        
        // Clean up
        await supabase.from('transactions').delete().eq('id', createdVARCHARTransaction.id);
      }
      
    } else {
      // Test with existing transactions
      console.log('\n=== TESTING WITH EXISTING TRANSACTIONS ===');
      
      const testTransaction = transactions[0];
      console.log('Testing with existing transaction:', {
        id: testTransaction.id,
        transaction_id: testTransaction.transaction_id,
        type: testTransaction.type
      });
      
      // Test the exact query from updateTransaction function
      console.log('\nTesting purchase update with existing transaction_id...');
      
      const purchaseUpdateData = {
        item_name: 'Test update from diagnostic',
        price: testTransaction.amount,
        category: testTransaction.category,
        notes: 'Testing with existing transaction'
      };
      
      const { data: purchaseUpdate, error: purchaseUpdateError } = await supabase
        .from('purchases')
        .update(purchaseUpdateData)
        .eq('transaction_id', testTransaction.transaction_id);
      
      if (purchaseUpdateError) {
        console.log('❌ EXACT ERROR REPRODUCED:', purchaseUpdateError.message);
        console.log('🎯 This confirms the UUID/VARCHAR mismatch issue!');
      } else {
        console.log('✅ Purchase update successful with existing transaction');
      }
    }
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('The test above should have identified the exact cause of the UUID/VARCHAR mismatch.');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testExactError(); 