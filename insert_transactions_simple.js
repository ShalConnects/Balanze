import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

// User details
const userId = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f';

async function insertDummyTransactions() {
  console.log('🚀 Starting to insert dummy transactions for user:', userId);
  
  try {
    // First, let's check what accounts exist for this user
    console.log('\n1. Checking existing accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, type, currency')
      .eq('user_id', userId);
    
    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No accounts found for user. Cannot insert transactions without an account.');
      console.log('Please create an account first through the application.');
      return;
    }
    
    console.log(`✅ Found ${accounts.length} accounts:`);
    accounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (${account.type}) - ${account.currency}`);
    });
    
    // Use the first available account (preferably cash, but any will do)
    const targetAccount = accounts.find(acc => acc.type === 'cash') || accounts[0];
    console.log(`\n📝 Using account: ${targetAccount.name} (${targetAccount.id})`);
    
    // Define dummy transactions
    const dummyTransactions = [
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 25.50,
        description: 'Grocery shopping at Lidl',
        category: 'Food & Dining',
        date: '2024-01-15',
        tags: ['groceries', 'food'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 4.20,
        description: 'Morning coffee at Starbucks',
        category: 'Food & Dining',
        date: '2024-01-16',
        tags: ['coffee', 'morning'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 12.80,
        description: 'Monthly transport pass',
        category: 'Transportation',
        date: '2024-01-17',
        tags: ['transport', 'monthly'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 89.99,
        description: 'Amazon purchase - books',
        category: 'Shopping',
        date: '2024-01-18',
        tags: ['books', 'online'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 45.30,
        description: 'Dinner at Italian restaurant',
        category: 'Food & Dining',
        date: '2024-01-19',
        tags: ['restaurant', 'dinner'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 29.99,
        description: 'Monthly gym membership',
        category: 'Healthcare',
        date: '2024-01-20',
        tags: ['gym', 'fitness'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 18.50,
        description: 'Cinema tickets for 2',
        category: 'Entertainment',
        date: '2024-01-21',
        tags: ['movies', 'entertainment'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 15.75,
        description: 'Medicine and vitamins',
        category: 'Healthcare',
        date: '2024-01-22',
        tags: ['medicine', 'health'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 67.40,
        description: 'New winter jacket',
        category: 'Shopping',
        date: '2024-01-23',
        tags: ['clothing', 'winter'],
        saving_amount: 0,
        is_recurring: false
      },
      {
        user_id: userId,
        account_id: targetAccount.id,
        type: 'expense',
        amount: 24.99,
        description: 'Monthly phone bill',
        category: 'Bills & Utilities',
        date: '2024-01-24',
        tags: ['phone', 'monthly'],
        saving_amount: 0,
        is_recurring: false
      }
    ];
    
    console.log('\n2. Inserting dummy transactions...');
    
    // Insert transactions one by one to handle any errors gracefully
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < dummyTransactions.length; i++) {
      const transaction = dummyTransactions[i];
      console.log(`   Inserting transaction ${i + 1}/${dummyTransactions.length}: ${transaction.description}`);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select();
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Success: ${data[0].id}`);
        successCount++;
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    // Verify the transactions were inserted
    console.log('\n3. Verifying inserted transactions...');
    const { data: insertedTransactions, error: verifyError } = await supabase
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        category,
        date,
        accounts!inner(name, currency)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Error verifying transactions:', verifyError);
    } else {
      console.log(`✅ Found ${insertedTransactions.length} transactions for user`);
      console.log('\n📋 Transaction Summary:');
      insertedTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.description} - €${tx.amount} (${tx.category}) - ${tx.date}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertDummyTransactions();
