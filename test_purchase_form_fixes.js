import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  console.error('You can copy env.template to .env and fill in your values');
  process.exit(1);
}

const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'testpass123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPurchaseFormFixes() {
  console.log('--- PURCHASE FORM FIXES TEST ---\n');

  let testAccountId = null;
  let testTransactionId = null;
  let testPurchaseId = null;

  try {
    // 1. Login as test user
    console.log('1. Logging in...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      process.exit(1);
    }
    const user = loginData.user;
    console.log('✅ Logged in as:', user.email);

    // 2. Create a test account
    console.log('\n2. Creating test account...');
    const accountName = 'Test Purchase Account ' + Date.now();
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: accountName,
        type: 'checking',
        initial_balance: 1000,
        currency: 'USD',
        is_active: true,
        description: 'Test account for purchase form fixes',
      })
      .select()
      .single();
    if (accountError) {
      console.error('❌ Account creation failed:', accountError.message);
      process.exit(1);
    }
    testAccountId = account.id;
    console.log('✅ Account created:', account.name, account.id);

    // 3. Test: Create purchase with transaction (should link properly)
    console.log('\n3. Testing: Create purchase with transaction...');
    const transactionId = 'F' + Date.now();
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: testAccountId,
        amount: 50.00,
        type: 'expense',
        category: 'Food & Dining',
        description: 'Test Purchase Item',
        date: new Date().toISOString().split('T')[0],
        tags: ['purchase'],
        transaction_id: transactionId,
      })
      .select('id')
      .single();
    if (txError) {
      console.error('❌ Transaction creation failed:', txError.message);
      process.exit(1);
    }
    testTransactionId = transaction.id;
    console.log('✅ Transaction created:', transaction.id);

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        transaction_id: transaction.id,
        item_name: 'Test Purchase Item',
        category: 'Food & Dining',
        price: 50.00,
        purchase_date: new Date().toISOString().split('T')[0],
        status: 'purchased',
        priority: 'medium',
        currency: 'USD',
        account_id: testAccountId,
      })
      .select()
      .single();
    if (purchaseError) {
      console.error('❌ Purchase creation failed:', purchaseError.message);
      process.exit(1);
    }
    testPurchaseId = purchase.id;
    console.log('✅ Purchase created with transaction link:', purchase.id);
    console.log('   - Transaction ID:', purchase.transaction_id);
    console.log('   - Account ID:', purchase.account_id);

    // 4. Test: Update purchase with account_id change (should sync to transaction)
    console.log('\n4. Testing: Update purchase with account_id change...');
    const { data: account2, error: account2Error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: 'Test Account 2 ' + Date.now(),
        type: 'checking',
        initial_balance: 500,
        currency: 'USD',
        is_active: true,
      })
      .select()
      .single();
    if (account2Error) {
      console.error('❌ Second account creation failed:', account2Error.message);
      process.exit(1);
    }
    console.log('✅ Second account created:', account2.id);

    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        account_id: account2.id,
        price: 60.00,
        item_name: 'Updated Purchase Item',
        purchase_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', testPurchaseId);
    if (updateError) {
      console.error('❌ Purchase update failed:', updateError.message);
      process.exit(1);
    }
    console.log('✅ Purchase updated with new account_id');

    // Verify transaction was synced
    const { data: syncedTransaction, error: syncCheckError } = await supabase
      .from('transactions')
      .select('account_id, amount, description, date')
      .eq('id', testTransactionId)
      .single();
    if (syncCheckError) {
      console.error('❌ Failed to verify transaction sync:', syncCheckError.message);
      process.exit(1);
    }
    console.log('✅ Transaction sync verified:');
    console.log('   - Account ID synced:', syncedTransaction.account_id === account2.id);
    console.log('   - Amount synced:', syncedTransaction.amount === 60.00);
    console.log('   - Description synced:', syncedTransaction.description === 'Updated Purchase Item');
    console.log('   - Date synced:', syncedTransaction.date === new Date().toISOString().split('T')[0]);

    // 5. Test: Create planned purchase (should not require account)
    console.log('\n5. Testing: Create planned purchase...');
    const { data: plannedPurchase, error: plannedError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        item_name: 'Planned Purchase',
        category: 'Shopping',
        price: 100.00,
        purchase_date: new Date().toISOString().split('T')[0],
        status: 'planned',
        priority: 'high',
        currency: 'USD',
      })
      .select()
      .single();
    if (plannedError) {
      console.error('❌ Planned purchase creation failed:', plannedError.message);
      process.exit(1);
    }
    console.log('✅ Planned purchase created:', plannedPurchase.id);
    console.log('   - No transaction required:', !plannedPurchase.transaction_id);
    console.log('   - No account required:', !plannedPurchase.account_id);

    // 6. Test: Update planned to purchased (should create transaction)
    console.log('\n6. Testing: Update planned to purchased...');
    const { error: statusUpdateError } = await supabase
      .from('purchases')
      .update({
        status: 'purchased',
        account_id: testAccountId,
      })
      .eq('id', plannedPurchase.id);
    if (statusUpdateError) {
      console.error('❌ Status update failed:', statusUpdateError.message);
      process.exit(1);
    }
    console.log('✅ Purchase status updated to purchased');

    // 7. Cleanup
    console.log('\n7. Cleaning up test data...');
    if (plannedPurchase?.id) {
      await supabase.from('purchases').delete().eq('id', plannedPurchase.id);
    }
    if (testPurchaseId) {
      await supabase.from('purchases').delete().eq('id', testPurchaseId);
    }
    if (testTransactionId) {
      await supabase.from('transactions').delete().eq('id', testTransactionId);
    }
    if (account2?.id) {
      await supabase.from('accounts').delete().eq('id', account2.id);
    }
    if (testAccountId) {
      await supabase.from('accounts').delete().eq('id', testAccountId);
    }
    console.log('✅ Cleanup completed');

    console.log('\n--- ALL PURCHASE FORM FIXES TESTS PASSED ---');
  } catch (error) {
    console.error('\n❌ Test error:', error);
    
    // Cleanup on error
    console.log('\nCleaning up on error...');
    if (testPurchaseId) {
      await supabase.from('purchases').delete().eq('id', testPurchaseId).catch(() => {});
    }
    if (testTransactionId) {
      await supabase.from('transactions').delete().eq('id', testTransactionId).catch(() => {});
    }
    if (testAccountId) {
      await supabase.from('accounts').delete().eq('id', testAccountId).catch(() => {});
    }
    
    process.exit(1);
  }
}

testPurchaseFormFixes().catch((err) => {
  console.error('❌ Script error:', err);
  process.exit(1);
});

