import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseUUIDMismatch() {
  console.log('🔍 DIAGNOSING UUID/VARCHAR MISMATCH ISSUE\n');
  
  try {
    // Step 1: Check current database schema
    console.log('=== STEP 1: CHECKING DATABASE SCHEMA ===');
    
    // Check if we can query the information_schema directly
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            table_name,
            column_name,
            data_type,
            character_maximum_length,
            is_nullable
          FROM information_schema.columns 
          WHERE column_name = 'transaction_id'
          ORDER BY table_name;
        `
      });
    
    if (schemaError) {
      console.log('❌ Cannot query schema directly:', schemaError.message);
    } else {
      console.log('✅ Schema query successful');
      console.log('Current transaction_id column types:');
      console.table(schemaData);
    }
    
    // Step 2: Check if transactions table exists and has data
    console.log('\n=== STEP 2: CHECKING TRANSACTIONS TABLE ===');
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, transaction_id, amount, type, description')
      .limit(5);
    
    if (transactionsError) {
      console.log('❌ Error accessing transactions table:', transactionsError.message);
    } else {
      console.log('✅ Transactions table accessible');
      console.log(`Found ${transactions?.length || 0} transactions`);
      if (transactions && transactions.length > 0) {
        console.log('Sample transaction data:');
        console.table(transactions.map(t => ({
          id: t.id,
          transaction_id: t.transaction_id,
          amount: t.amount,
          type: t.type,
          description: t.description?.substring(0, 20) + '...'
        })));
      }
    }
    
    // Step 3: Check purchases table
    console.log('\n=== STEP 3: CHECKING PURCHASES TABLE ===');
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, transaction_id, item_name, price')
      .limit(5);
    
    if (purchasesError) {
      console.log('❌ Error accessing purchases table:', purchasesError.message);
    } else {
      console.log('✅ Purchases table accessible');
      console.log(`Found ${purchases?.length || 0} purchases`);
      if (purchases && purchases.length > 0) {
        console.log('Sample purchase data:');
        console.table(purchases.map(p => ({
          id: p.id,
          transaction_id: p.transaction_id,
          item_name: p.item_name?.substring(0, 20) + '...',
          price: p.price
        })));
      }
    }
    
    // Step 4: Test the exact query that's failing
    console.log('\n=== STEP 4: TESTING THE FAILING QUERY ===');
    
    if (transactions && transactions.length > 0) {
      const testTransaction = transactions[0];
      console.log(`Testing with transaction: ${testTransaction.id}`);
      console.log(`Transaction ID: ${testTransaction.transaction_id}`);
      console.log(`Transaction ID type: ${typeof testTransaction.transaction_id}`);
      
      // Test the exact query from updateTransaction function
      const { data: purchaseTest, error: purchaseTestError } = await supabase
        .from('purchases')
        .select('*')
        .eq('transaction_id', testTransaction.transaction_id);
      
      if (purchaseTestError) {
        console.log('❌ EXACT ERROR FOUND:', purchaseTestError.message);
        console.log('This is the query that\'s failing in your updateTransaction function!');
      } else {
        console.log('✅ Purchase query successful');
        console.log(`Found ${purchaseTest?.length || 0} related purchases`);
      }
    }
    
    // Step 5: Check if there are any foreign key constraints
    console.log('\n=== STEP 5: CHECKING FOREIGN KEY CONSTRAINTS ===');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND kcu.column_name = 'transaction_id';
        `
      });
    
    if (constraintsError) {
      console.log('❌ Cannot query constraints:', constraintsError.message);
    } else {
      console.log('✅ Constraints query successful');
      if (constraints && constraints.length > 0) {
        console.log('Foreign key constraints on transaction_id:');
        console.table(constraints);
      } else {
        console.log('No foreign key constraints found on transaction_id columns');
      }
    }
    
    // Step 6: Test a simple update operation
    console.log('\n=== STEP 6: TESTING SIMPLE UPDATE OPERATION ===');
    
    if (transactions && transactions.length > 0) {
      const testTransaction = transactions[0];
      console.log(`Testing update on transaction: ${testTransaction.id}`);
      
      const { data: updateTest, error: updateTestError } = await supabase
        .from('transactions')
        .update({ 
          description: testTransaction.description + ' (test update)',
          updated_at: new Date().toISOString()
        })
        .eq('id', testTransaction.id)
        .select()
        .single();
      
      if (updateTestError) {
        console.log('❌ Transaction update failed:', updateTestError.message);
      } else {
        console.log('✅ Transaction update successful');
        
        // Now test the purchase update that's likely failing
        if (testTransaction.transaction_id) {
          console.log(`Testing purchase update with transaction_id: ${testTransaction.transaction_id}`);
          
          const { data: purchaseUpdateTest, error: purchaseUpdateError } = await supabase
            .from('purchases')
            .update({ 
              notes: 'Test update from diagnostic script',
              updated_at: new Date().toISOString()
            })
            .eq('transaction_id', testTransaction.transaction_id);
          
          if (purchaseUpdateError) {
            console.log('❌ PURCHASE UPDATE FAILED:', purchaseUpdateError.message);
            console.log('This confirms the UUID/VARCHAR mismatch issue!');
          } else {
            console.log('✅ Purchase update successful');
          }
        }
      }
    }
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('Check the output above to identify the exact cause of the UUID/VARCHAR mismatch.');
    
  } catch (error) {
    console.error('Error in diagnosis:', error);
  }
}

diagnoseUUIDMismatch(); 