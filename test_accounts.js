import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'testpass123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('--- ACCOUNT FUNCTIONALITY TEST ---');

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

  // 2. Create a new account
  const accountName = 'Test Account ' + Date.now();
  const { data: createData, error: createError } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name: accountName,
      type: 'checking',
      initial_balance: 100,
      currency: 'USD',
      is_active: true,
      description: 'Automated test account',
    })
    .select()
    .single();
  if (createError) {
    console.error('❌ Account creation failed:', createError.message);
    process.exit(1);
  }
  console.log('✅ Account created:', createData.name, createData.id);

  // 3. Fetch all accounts for the user
  const { data: accounts, error: fetchError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);
  if (fetchError) {
    console.error('❌ Fetch accounts failed:', fetchError.message);
    process.exit(1);
  }
  console.log('✅ Accounts fetched:', accounts.length);

  // 4. Update the account (change name, currency, deactivate)
  const updatedName = accountName + ' Updated';
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ name: updatedName, currency: 'EUR', is_active: false })
    .eq('id', createData.id);
  if (updateError) {
    console.error('❌ Account update failed:', updateError.message);
    process.exit(1);
  }
  console.log('✅ Account updated (name, currency, deactivated)');

  // 5. Fetch the updated account
  const { data: updatedAccount, error: fetchUpdatedError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', createData.id)
    .single();
  if (fetchUpdatedError) {
    console.error('❌ Fetch updated account failed:', fetchUpdatedError.message);
    process.exit(1);
  }
  if (!updatedAccount.is_active && updatedAccount.name === updatedName && updatedAccount.currency === 'EUR') {
    console.log('✅ Account update verified');
  } else {
    console.error('❌ Account update verification failed');
    process.exit(1);
  }

  // 6. Reactivate the account
  const { error: reactivateError } = await supabase
    .from('accounts')
    .update({ is_active: true })
    .eq('id', createData.id);
  if (reactivateError) {
    console.error('❌ Account reactivation failed:', reactivateError.message);
    process.exit(1);
  }
  console.log('✅ Account reactivated');

  // 7. Delete the account
  const { error: deleteError } = await supabase
    .from('accounts')
    .delete()
    .eq('id', createData.id);
  if (deleteError) {
    console.error('❌ Account deletion failed:', deleteError.message);
    process.exit(1);
  }
  console.log('✅ Account deleted');

  // 8. Confirm deletion
  const { data: deletedAccount } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', createData.id)
    .maybeSingle();
  if (!deletedAccount) {
    console.log('✅ Account deletion verified');
  } else {
    console.error('❌ Account still exists after deletion');
    process.exit(1);
  }

  console.log('--- ALL ACCOUNT TESTS PASSED ---');
}

main().catch((err) => {
  console.error('❌ Script error:', err);
  process.exit(1);
}); 