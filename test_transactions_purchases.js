import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'testpass123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('--- TRANSACTION & PURCHASE FUNCTIONALITY TEST ---');

  // 1. Login as test user
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

  // 2. Create a new account for transactions
  const accountName = 'Test Tx Account ' + Date.now();
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name: accountName,
      type: 'checking',
      initial_balance: 100,
      currency: 'USD',
      is_active: true,
      description: 'Automated test tx account',
    })
    .select()
    .single();
  if (accountError) {
    console.error('❌ Account creation failed:', accountError.message);
    process.exit(1);
  }
  console.log('✅ Account created:', account.name, account.id);

  // 3. Create a transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: account.id,
      amount: 50,
      type: 'expense',
      category: 'Food & Dining',
      date: new Date().toISOString(),
      description: 'Automated test transaction',
    })
    .select()
    .single();
  if (txError) {
    console.error('❌ Transaction creation failed:', txError.message);
    process.exit(1);
  }
  console.log('✅ Transaction created:', transaction.id);

  // 4. Fetch transactions for the account
  const { data: transactions, error: fetchTxError } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', account.id);
  if (fetchTxError) {
    console.error('❌ Fetch transactions failed:', fetchTxError.message);
    process.exit(1);
  }
  console.log('✅ Transactions fetched:', transactions.length);

  // 5. Update the transaction
  const { error: updateTxError } = await supabase
    .from('transactions')
    .update({ amount: 60, description: 'Updated test transaction' })
    .eq('id', transaction.id);
  if (updateTxError) {
    console.error('❌ Transaction update failed:', updateTxError.message);
    process.exit(1);
  }
  console.log('✅ Transaction updated');

  // 6. Create a purchase linked to the transaction
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      user_id: user.id,
      transaction_id: transaction.id,
      item_name: 'Test Item',
      category: 'Food & Dining',
      price: 60,
      purchase_date: new Date().toISOString(),
      status: 'purchased',
      priority: 'medium',
      notes: 'Automated test purchase',
      currency: 'USD',
    })
    .select()
    .single();
  if (purchaseError) {
    console.error('❌ Purchase creation failed:', purchaseError.message);
    process.exit(1);
  }
  console.log('✅ Purchase created:', purchase.id);

  // 7. Fetch purchases for the user
  const { data: purchases, error: fetchPurchasesError } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', user.id);
  if (fetchPurchasesError) {
    console.error('❌ Fetch purchases failed:', fetchPurchasesError.message);
    process.exit(1);
  }
  console.log('✅ Purchases fetched:', purchases.length);

  // 8. Update the purchase
  const { error: updatePurchaseError } = await supabase
    .from('purchases')
    .update({ price: 70, notes: 'Updated test purchase' })
    .eq('id', purchase.id);
  if (updatePurchaseError) {
    console.error('❌ Purchase update failed:', updatePurchaseError.message);
    process.exit(1);
  }
  console.log('✅ Purchase updated');

  // 9. Delete the purchase
  const { error: deletePurchaseError } = await supabase
    .from('purchases')
    .delete()
    .eq('id', purchase.id);
  if (deletePurchaseError) {
    console.error('❌ Purchase deletion failed:', deletePurchaseError.message);
    process.exit(1);
  }
  console.log('✅ Purchase deleted');

  // 10. Delete the transaction
  const { error: deleteTxError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transaction.id);
  if (deleteTxError) {
    console.error('❌ Transaction deletion failed:', deleteTxError.message);
    process.exit(1);
  }
  console.log('✅ Transaction deleted');

  // 11. Delete the account
  const { error: deleteAccountError } = await supabase
    .from('accounts')
    .delete()
    .eq('id', account.id);
  if (deleteAccountError) {
    console.error('❌ Account deletion failed:', deleteAccountError.message);
    process.exit(1);
  }
  console.log('✅ Account deleted');

  console.log('--- ALL TRANSACTION & PURCHASE TESTS PASSED ---');
}

main().catch((err) => {
  console.error('❌ Script error:', err);
  process.exit(1);
}); 