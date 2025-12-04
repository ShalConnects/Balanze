import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'testpass123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('--- LEND & BORROW FUNCTIONALITY TEST ---');

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

  // 2. Create a lend/borrow record
  const { data: lbRecord, error: lbError } = await supabase
    .from('lend_borrow')
    .insert({
      user_id: user.id,
      type: 'lend',
      person_name: 'Test Person',
      amount: 200,
      currency: 'USD',
      description: 'Automated test lend',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 1 week from now
      status: 'active',
      notes: 'Automated test lend',
      is_installment: false,
      partial_return: 0,
    })
    .select()
    .single();
  if (lbError) {
    console.error('❌ Lend/Borrow creation failed:', lbError.message);
    process.exit(1);
  }
  console.log('✅ Lend/Borrow record created:', lbRecord.id);

  // 3. Fetch lend/borrow records for the user
  const { data: lbRecords, error: fetchLbError } = await supabase
    .from('lend_borrow')
    .select('*')
    .eq('user_id', user.id);
  if (fetchLbError) {
    console.error('❌ Fetch lend/borrow records failed:', fetchLbError.message);
    process.exit(1);
  }
  console.log('✅ Lend/Borrow records fetched:', lbRecords.length);

  // 4. Update the lend/borrow record
  const { error: updateLbError } = await supabase
    .from('lend_borrow')
    .update({ amount: 250, status: 'returned', notes: 'Updated test lend', partial_return: 50, partial_return_date: new Date().toISOString() })
    .eq('id', lbRecord.id);
  if (updateLbError) {
    console.error('❌ Lend/Borrow update failed:', updateLbError.message);
    process.exit(1);
  }
  console.log('✅ Lend/Borrow record updated');

  // 5. Delete the lend/borrow record
  const { error: deleteLbError } = await supabase
    .from('lend_borrow')
    .delete()
    .eq('id', lbRecord.id);
  if (deleteLbError) {
    console.error('❌ Lend/Borrow deletion failed:', deleteLbError.message);
    process.exit(1);
  }
  console.log('✅ Lend/Borrow record deleted');

  console.log('--- ALL LEND & BORROW TESTS PASSED ---');
}

main().catch((err) => {
  console.error('❌ Script error:', err);
  process.exit(1);
}); 