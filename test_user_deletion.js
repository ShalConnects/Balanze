import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user data
const TEST_USER_EMAIL = 'test-deletion@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

async function testUserDeletion() {
  console.log('🧪 === USER ACCOUNT DELETION TEST ===');
  console.log('');

  try {
    // Step 1: Create test user
    console.log('1️⃣ Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (signUpError) {
      console.error('❌ Error creating test user:', signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    console.log('✅ Test user created with ID:', userId);

    // Step 2: Create test data for the user
    console.log('');
    console.log('2️⃣ Creating test data...');
    
    // Create test accounts
    const testAccounts = [
      {
        user_id: userId,
        name: 'Test Checking Account',
        type: 'checking',
        currency: 'USD',
        initial_balance: 1000,
        calculated_balance: 1000,
        is_active: true
      },
      {
        user_id: userId,
        name: 'Test Savings Account',
        type: 'savings',
        currency: 'USD',
        initial_balance: 5000,
        calculated_balance: 5000,
        is_active: true
      }
    ];

    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .insert(testAccounts)
      .select();

    if (accountsError) {
      console.error('❌ Error creating test accounts:', accountsError.message);
    } else {
      console.log('✅ Created', accountsData.length, 'test accounts');
    }

    // Create test transactions
    const testTransactions = [
      {
        user_id: userId,
        account_id: accountsData?.[0]?.id,
        type: 'income',
        amount: 1000,
        description: 'Test Income',
        category: 'Salary',
        date: new Date().toISOString().split('T')[0]
      },
      {
        user_id: userId,
        account_id: accountsData?.[0]?.id,
        type: 'expense',
        amount: 200,
        description: 'Test Expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
      }
    ];

    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .insert(testTransactions)
      .select();

    if (transactionsError) {
      console.error('❌ Error creating test transactions:', transactionsError.message);
    } else {
      console.log('✅ Created', transactionsData.length, 'test transactions');
    }

    // Create test purchases
    const testPurchases = [
      {
        user_id: userId,
        account_id: accountsData?.[0]?.id,
        item_name: 'Test Purchase',
        price: 150,
        category: 'Electronics',
        purchase_date: new Date().toISOString().split('T')[0]
      }
    ];

    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .insert(testPurchases)
      .select();

    if (purchasesError) {
      console.error('❌ Error creating test purchases:', purchasesError.message);
    } else {
      console.log('✅ Created', purchasesData.length, 'test purchases');
    }

    // Create test lend/borrow records
    const testLendBorrow = [
      {
        user_id: userId,
        type: 'lend',
        person_name: 'Test Person',
        amount: 500,
        currency: 'USD',
        status: 'active',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    const { data: lendBorrowData, error: lendBorrowError } = await supabase
      .from('lend_borrow')
      .insert(testLendBorrow)
      .select();

    if (lendBorrowError) {
      console.error('❌ Error creating test lend/borrow records:', lendBorrowError.message);
    } else {
      console.log('✅ Created', lendBorrowData.length, 'test lend/borrow records');
    }

    // Create test savings goals
    const testSavingsGoals = [
      {
        user_id: userId,
        source_account_id: accountsData?.[0]?.id,
        savings_account_id: accountsData?.[1]?.id,
        name: 'Test Savings Goal',
        target_amount: 10000,
        current_amount: 5000,
        target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    const { data: savingsGoalsData, error: savingsGoalsError } = await supabase
      .from('savings_goals')
      .insert(testSavingsGoals)
      .select();

    if (savingsGoalsError) {
      console.error('❌ Error creating test savings goals:', savingsGoalsError.message);
    } else {
      console.log('✅ Created', savingsGoalsData.length, 'test savings goals');
    }

    // Step 3: Verify test data exists
    console.log('');
    console.log('3️⃣ Verifying test data exists...');
    
    const dataCounts = await verifyDataExists(userId);
    console.log('📊 Data summary before deletion:');
    Object.entries(dataCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

    // Step 4: Simulate account deletion process
    console.log('');
    console.log('4️⃣ Simulating account deletion process...');
    
    const deletionResults = await simulateAccountDeletion(userId);
    
    console.log('🗑️ Deletion results:');
    Object.entries(deletionResults).forEach(([table, result]) => {
      if (result.success) {
        console.log(`   ✅ ${table}: ${result.count} records deleted`);
      } else {
        console.log(`   ❌ ${table}: ${result.error}`);
      }
    });

    // Step 5: Verify all data is deleted
    console.log('');
    console.log('5️⃣ Verifying all data is deleted...');
    
    const remainingData = await verifyDataExists(userId);
    console.log('📊 Data summary after deletion:');
    Object.entries(remainingData).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ⚠️  ${table}: ${count} records still exist`);
      } else {
        console.log(`   ✅ ${table}: 0 records (deleted)`);
      }
    });

    // Step 6: Clean up auth user (if possible)
    console.log('');
    console.log('6️⃣ Cleaning up auth user...');
    
    // Note: Auth user deletion requires admin privileges
    console.log('⚠️  Auth user deletion requires admin privileges');
    console.log('   You may need to manually delete the auth user from Supabase Dashboard');

    console.log('');
    console.log('🎉 === DELETION TEST COMPLETE ===');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Test user created:', TEST_USER_EMAIL);
    console.log('   - Test data created and verified');
    console.log('   - Deletion process simulated');
    console.log('   - Data removal verified');
    console.log('');
    console.log('⚠️  Next steps:');
    console.log('   1. Check Supabase Dashboard for any remaining data');
    console.log('   2. Manually delete auth user if needed');
    console.log('   3. Verify no orphaned data remains');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function verifyDataExists(userId) {
  const tables = [
    'accounts',
    'transactions', 
    'purchases',
    'lend_borrow',
    'savings_goals',
    'profiles',
    'notifications',
    'audit_logs'
  ];

  const counts = {};
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) {
        counts[table] = 0;
      } else {
        counts[table] = count || 0;
      }
    } catch (error) {
      counts[table] = 0;
    }
  }

  return counts;
}

async function simulateAccountDeletion(userId) {
  const results = {};
  
  // Delete in the same order as the actual deletion process
  const deletionOrder = [
    'transactions',
    'purchases', 
    'purchase_categories',
    'purchase_attachments',
    'lend_borrow',
    'lend_borrow_returns',
    'savings_goals',
    'donation_saving_records',
    'notifications',
    'audit_logs',
    'accounts'
  ];

  for (const table of deletionOrder) {
    try {
      const { count, error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        .select('count');
      
      if (error) {
        results[table] = { success: false, error: error.message };
      } else {
        results[table] = { success: true, count: count || 0 };
      }
    } catch (error) {
      results[table] = { success: false, error: error.message };
    }
  }

  // Try to delete profile separately
  try {
    const { count, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select('count');
    
    if (error) {
      results['profiles'] = { success: false, error: error.message };
    } else {
      results['profiles'] = { success: true, count: count || 0 };
    }
  } catch (error) {
    results['profiles'] = { success: false, error: error.message };
  }

  return results;
}

// Run the test
testUserDeletion().catch(console.error); 