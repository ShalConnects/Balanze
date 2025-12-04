// Test script to check if transaction_id columns exist
const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactionIdColumns() {
  try {
    console.log('Checking for transaction_id columns...');
    
    // Check transactions table
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('transaction_id')
      .limit(1);
    
    if (transactionsError) {
      console.log('❌ transactions table error:', transactionsError.message);
    } else {
      console.log('✅ transactions table has transaction_id column');
    }
    
    // Check dps_transfers table
    const { data: dpsTransfers, error: dpsError } = await supabase
      .from('dps_transfers')
      .select('transaction_id')
      .limit(1);
    
    if (dpsError) {
      console.log('❌ dps_transfers table error:', dpsError.message);
    } else {
      console.log('✅ dps_transfers table has transaction_id column');
    }
    
    // Check accounts table
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('transaction_id')
      .limit(1);
    
    if (accountsError) {
      console.log('❌ accounts table error:', accountsError.message);
    } else {
      console.log('✅ accounts table has transaction_id column');
    }
    
  } catch (error) {
    console.error('Error checking columns:', error);
  }
}

checkTransactionIdColumns(); 