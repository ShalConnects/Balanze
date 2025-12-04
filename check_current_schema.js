import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking current database schema...\n');
  
  try {
    // Check transactions table
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('transaction_id, id')
      .limit(5);
    
    if (transactionsError) {
      console.log('❌ Error accessing transactions table:', transactionsError.message);
    } else {
      console.log('✅ Transactions table accessible');
      console.log('Sample transaction_id values:', transactions?.map(t => t.transaction_id));
    }
    
    // Check purchases table
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('transaction_id, id')
      .limit(5);
    
    if (purchasesError) {
      console.log('❌ Error accessing purchases table:', purchasesError.message);
    } else {
      console.log('✅ Purchases table accessible');
      console.log('Sample transaction_id values:', purchases?.map(p => p.transaction_id));
    }
    
    // Check if we can query with transaction_id
    console.log('\n--- Testing transaction_id queries ---');
    
    // Try to find a transaction by transaction_id
    if (transactions && transactions.length > 0) {
      const testTransactionId = transactions[0].transaction_id;
      console.log(`Testing query with transaction_id: ${testTransactionId}`);
      
      const { data: foundTransaction, error: findError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', testTransactionId)
        .single();
      
      if (findError) {
        console.log('❌ Error finding transaction by transaction_id:', findError.message);
      } else {
        console.log('✅ Successfully found transaction by transaction_id');
      }
    }
    
    // Check if purchases table has transaction_id column
    console.log('\n--- Checking purchases table structure ---');
    const { data: purchaseColumns, error: columnsError } = await supabase
      .from('purchases')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log('❌ Error checking purchases structure:', columnsError.message);
    } else {
      console.log('✅ Purchases table structure accessible');
      if (purchaseColumns && purchaseColumns.length > 0) {
        console.log('Available columns:', Object.keys(purchaseColumns[0]));
      }
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema(); 