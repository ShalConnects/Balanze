import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';
const testEmail = 'salauddin.kader405@gmail.com';
const testPassword = 'New12###T';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, passed, error = null) {
  if (passed) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}`);
    if (error) {
      console.log(`   Error: ${error}`);
      testResults.errors.push({ test: testName, error });
    }
    testResults.failed++;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test 1: Sign in with valid credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      logTest('User Sign In', false, signInError.message);
      return false;
    }
    
    logTest('User Sign In', true);
    console.log(`   User ID: ${signInData.user.id}`);
    console.log(`   Email: ${signInData.user.email}`);
    
    // Test 2: Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logTest('Get Session', false, sessionError.message);
    } else {
      logTest('Get Session', true);
    }
    
    return true;
  } catch (error) {
    logTest('Authentication Setup', false, error.message);
    return false;
  }
}

async function testCategories() {
  console.log('\n📂 Testing Categories...');
  
  try {
    // Test 1: Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (categoriesError) {
      logTest('Fetch Categories', false, categoriesError.message);
    } else {
      logTest('Fetch Categories', true);
      console.log(`   Found ${categories.length} categories`);
      
      // Show category breakdown
      const incomeCategories = categories.filter(cat => cat.type === 'income');
      const expenseCategories = categories.filter(cat => cat.type === 'expense');
      console.log(`   Income categories: ${incomeCategories.length}`);
      console.log(`   Expense categories: ${expenseCategories.length}`);
    }
    
    // Test 2: Fetch purchase categories
    const { data: purchaseCategories, error: purchaseCategoriesError } = await supabase
      .from('purchase_categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (purchaseCategoriesError) {
      logTest('Fetch Purchase Categories', false, purchaseCategoriesError.message);
    } else {
      logTest('Fetch Purchase Categories', true);
      console.log(`   Found ${purchaseCategories.length} purchase categories`);
    }
    
    // Test 3: Add a test income category
    const testIncomeCategory = {
      name: 'Test Income Category',
      type: 'income',
      color: '#10B981',
      icon: 'Test',
      description: 'Test category for automated testing'
    };
    
    const { data: newIncomeCategory, error: addIncomeError } = await supabase
      .from('categories')
      .insert(testIncomeCategory)
      .select()
      .single();
    
    if (addIncomeError) {
      logTest('Add Income Category', false, addIncomeError.message);
    } else {
      logTest('Add Income Category', true);
      console.log(`   Created category: ${newIncomeCategory.name}`);
      
      // Clean up - delete the test category
      await supabase.from('categories').delete().eq('id', newIncomeCategory.id);
      console.log('   Cleaned up test category');
    }
    
    // Test 4: Add a test purchase category
    const testPurchaseCategory = {
      category_name: 'Test Purchase Category',
      description: 'Test category for automated testing',
      monthly_budget: 100,
      currency: 'USD',
      category_color: '#3B82F6'
    };
    
    const { data: newPurchaseCategory, error: addPurchaseError } = await supabase
      .from('purchase_categories')
      .insert(testPurchaseCategory)
      .select()
      .single();
    
    if (addPurchaseError) {
      logTest('Add Purchase Category', false, addPurchaseError.message);
    } else {
      logTest('Add Purchase Category', true);
      console.log(`   Created category: ${newPurchaseCategory.category_name}`);
      
      // Clean up - delete the test category
      await supabase.from('purchase_categories').delete().eq('id', newPurchaseCategory.id);
      console.log('   Cleaned up test purchase category');
    }
    
  } catch (error) {
    logTest('Categories Testing', false, error.message);
  }
}

async function testAccounts() {
  console.log('\n🏦 Testing Accounts...');
  
  try {
    // Test 1: Fetch accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (accountsError) {
      logTest('Fetch Accounts', false, accountsError.message);
    } else {
      logTest('Fetch Accounts', true);
      console.log(`   Found ${accounts.length} accounts`);
      
      // Show account breakdown
      accounts.forEach(account => {
        console.log(`   - ${account.name}: ${account.calculated_balance} ${account.currency}`);
      });
    }
    
    // Test 2: Add a test account
    const testAccount = {
      name: 'Test Account',
      type: 'cash',
      currency: 'USD',
      initial_balance: 1000,
      calculated_balance: 1000
    };
    
    const { data: newAccount, error: addAccountError } = await supabase
      .from('accounts')
      .insert(testAccount)
      .select()
      .single();
    
    if (addAccountError) {
      logTest('Add Account', false, addAccountError.message);
    } else {
      logTest('Add Account', true);
      console.log(`   Created account: ${newAccount.name}`);
      
      // Clean up - delete the test account
      await supabase.from('accounts').delete().eq('id', newAccount.id);
      console.log('   Cleaned up test account');
    }
    
  } catch (error) {
    logTest('Accounts Testing', false, error.message);
  }
}

async function testTransactions() {
  console.log('\n💰 Testing Transactions...');
  
  try {
    // Test 1: Fetch transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (transactionsError) {
      logTest('Fetch Transactions', false, transactionsError.message);
    } else {
      logTest('Fetch Transactions', true);
      console.log(`   Found ${transactions.length} transactions`);
      
      // Show transaction breakdown
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      console.log(`   Income transactions: ${incomeTransactions.length}`);
      console.log(`   Expense transactions: ${expenseTransactions.length}`);
    }
    
    // Test 2: Add a test transaction (requires account and category)
    const { data: accounts } = await supabase.from('accounts').select('id').limit(1);
    const { data: categories } = await supabase.from('categories').select('id').limit(1);
    
    if (accounts.length > 0 && categories.length > 0) {
      const testTransaction = {
        account_id: accounts[0].id,
        amount: 100,
        type: 'income',
        category: 'Test Category',
        description: 'Test transaction for automated testing',
        date: new Date().toISOString().split('T')[0]
      };
      
      const { data: newTransaction, error: addTransactionError } = await supabase
        .from('transactions')
        .insert(testTransaction)
        .select()
        .single();
      
      if (addTransactionError) {
        logTest('Add Transaction', false, addTransactionError.message);
      } else {
        logTest('Add Transaction', true);
        console.log(`   Created transaction: ${newTransaction.description}`);
        
        // Clean up - delete the test transaction
        await supabase.from('transactions').delete().eq('id', newTransaction.id);
        console.log('   Cleaned up test transaction');
      }
    } else {
      logTest('Add Transaction', false, 'No accounts or categories available for testing');
    }
    
  } catch (error) {
    logTest('Transactions Testing', false, error.message);
  }
}

async function testPurchases() {
  console.log('\n🛒 Testing Purchases...');
  
  try {
    // Test 1: Fetch purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (purchasesError) {
      logTest('Fetch Purchases', false, purchasesError.message);
    } else {
      logTest('Fetch Purchases', true);
      console.log(`   Found ${purchases.length} purchases`);
      
      // Show purchase breakdown
      const plannedPurchases = purchases.filter(p => p.status === 'planned');
      const purchasedItems = purchases.filter(p => p.status === 'purchased');
      const cancelledPurchases = purchases.filter(p => p.status === 'cancelled');
      console.log(`   Planned: ${plannedPurchases.length}`);
      console.log(`   Purchased: ${purchasedItems.length}`);
      console.log(`   Cancelled: ${cancelledPurchases.length}`);
    }
    
    // Test 2: Add a test purchase (requires account and category)
    const { data: accounts } = await supabase.from('accounts').select('id').limit(1);
    const { data: purchaseCategories } = await supabase.from('purchase_categories').select('id').limit(1);
    
    if (accounts.length > 0 && purchaseCategories.length > 0) {
      const testPurchase = {
        item_name: 'Test Item',
        price: 50,
        currency: 'USD',
        category: 'Test Category',
        priority: 'medium',
        status: 'planned',
        account_id: accounts[0].id,
        notes: 'Test purchase for automated testing'
      };
      
      const { data: newPurchase, error: addPurchaseError } = await supabase
        .from('purchases')
        .insert(testPurchase)
        .select()
        .single();
      
      if (addPurchaseError) {
        logTest('Add Purchase', false, addPurchaseError.message);
      } else {
        logTest('Add Purchase', true);
        console.log(`   Created purchase: ${newPurchase.item_name}`);
        
        // Clean up - delete the test purchase
        await supabase.from('purchases').delete().eq('id', newPurchase.id);
        console.log('   Cleaned up test purchase');
      }
    } else {
      logTest('Add Purchase', false, 'No accounts or purchase categories available for testing');
    }
    
  } catch (error) {
    logTest('Purchases Testing', false, error.message);
  }
}

async function testUserProfile() {
  console.log('\n👤 Testing User Profile...');
  
  try {
    // Test 1: Fetch user profile
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logTest('Get User', false, 'No authenticated user found');
      return;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      logTest('Fetch Profile', false, profileError.message);
    } else {
      logTest('Fetch Profile', true);
      console.log(`   Full Name: ${profile.fullName || 'Not set'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Profile Picture: ${profile.profilePicture ? 'Set' : 'Not set'}`);
    }
    
  } catch (error) {
    logTest('User Profile Testing', false, error.message);
  }
}

async function testDatabaseStructure() {
  console.log('\n🗄️ Testing Database Structure...');
  
  try {
    // Test 1: Check all tables exist and are accessible
    const tables = [
      'profiles',
      'accounts', 
      'categories',
      'purchase_categories',
      'transactions',
      'purchases',
      'lend_borrow',
      'lend_borrow_returns',
      'savings_goals',
      'donation_saving_records',
      'notifications',
      'audit_logs'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          logTest(`Table ${table}`, false, error.message);
        } else {
          logTest(`Table ${table}`, true);
        }
      } catch (error) {
        logTest(`Table ${table}`, false, error.message);
      }
    }
    
  } catch (error) {
    logTest('Database Structure Testing', false, error.message);
  }
}

async function testRecentFixes() {
  console.log('\n🔧 Testing Recent Fixes...');
  
  try {
    // Test 1: Check if categories are properly synced
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'expense');
    
    const { data: purchaseCategories } = await supabase
      .from('purchase_categories')
      .select('*');
    
    const expenseCategoryNames = categories.map(c => c.name);
    const purchaseCategoryNames = purchaseCategories.map(pc => pc.category_name);
    
    // Check for missing expense categories in purchase categories
    const missingCategories = expenseCategoryNames.filter(expenseName => 
      !purchaseCategoryNames.includes(expenseName)
    );
    
    if (missingCategories.length > 0) {
      logTest('Category Sync', false, `Missing categories: ${missingCategories.join(', ')}`);
    } else {
      logTest('Category Sync', true);
      console.log('   All expense categories are synced with purchase categories');
    }
    
    // Test 2: Check for any orphaned records
    const { data: orphanedTransactions } = await supabase
      .from('transactions')
      .select('*')
      .is('account_id', null);
    
    if (orphanedTransactions.length > 0) {
      logTest('Data Integrity', false, `Found ${orphanedTransactions.length} orphaned transactions`);
    } else {
      logTest('Data Integrity', true);
      console.log('   No orphaned transactions found');
    }
    
  } catch (error) {
    logTest('Recent Fixes Testing', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Balanze App Test Suite');
  console.log('=' .repeat(60));
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
    return;
  }
  
  // Run all other tests
  await testUserProfile();
  await testDatabaseStructure();
  await testCategories();
  await testAccounts();
  await testTransactions();
  await testPurchases();
  await testRecentFixes();
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 DETAILED ERRORS:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   ${test}: ${error}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.failed === 0) {
    console.log('   ✅ All tests passed! Your Balanze app is working perfectly.');
  } else {
    console.log('   ⚠️  Some tests failed. Please review the errors above.');
    console.log('   🔧 Consider running individual test functions to debug specific issues.');
  }
  
  console.log('\n✨ Test suite completed!');
}

// Run the tests
runAllTests().catch(console.error); 