import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUserForReuse(email) {
  console.log('=== Delete User for Email Reuse ===');
  
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node delete_user_for_reuse.js <email>');
    process.exit(1);
  }
  
  try {
    console.log(`📧 Deleting user with email: ${email}`);
    
    // Step 1: Find the user in auth.users
    console.log('1. Finding user in auth.users...');
    const { data: users, error: findError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email);
    
    if (findError) {
      console.log('⚠️  Cannot directly query auth.users, trying alternative approach...');
    }
    
    // Step 2: Delete from profiles table
    console.log('2. Deleting from profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', email)
      .select();
    
    if (profileError) {
      console.log('❌ Error deleting from profiles:', profileError.message);
    } else {
      console.log(`✅ Deleted ${profileData?.length || 0} profile records`);
    }
    
    // Step 3: Delete from accounts table
    console.log('3. Deleting from accounts table...');
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .delete()
      .eq('user_id', (users?.[0]?.id || 'unknown'))
      .select();
    
    if (accountError) {
      console.log('❌ Error deleting from accounts:', accountError.message);
    } else {
      console.log(`✅ Deleted ${accountData?.length || 0} account records`);
    }
    
    // Step 4: Delete from transactions table
    console.log('4. Deleting from transactions table...');
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', (users?.[0]?.id || 'unknown'))
      .select();
    
    if (transactionError) {
      console.log('❌ Error deleting from transactions:', transactionError.message);
    } else {
      console.log(`✅ Deleted ${transactionData?.length || 0} transaction records`);
    }
    
    // Step 5: Manual deletion instructions
    console.log('\n5. Manual Steps Required:');
    console.log('   Since we cannot directly delete from auth.users via API,');
    console.log('   you need to manually delete the user from Supabase Dashboard:');
    console.log('');
    console.log('   📋 Steps:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log(`   2. Find user with email: ${email}`);
    console.log('   3. Click the three dots (⋮) next to the user');
    console.log('   4. Select "Delete user"');
    console.log('   5. Confirm deletion');
    console.log('');
    console.log('   ✅ After manual deletion, you can register with the same email again!');
    
    console.log('\n=== Summary ===');
    console.log(`📧 Email: ${email}`);
    console.log('🗑️  Profile records deleted');
    console.log('🗑️  Account records deleted');
    console.log('🗑️  Transaction records deleted');
    console.log('⚠️  Manual deletion required from auth.users');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node delete_user_for_reuse.js <email>');
  console.log('Example: node delete_user_for_reuse.js test@example.com');
  process.exit(1);
}

deleteUserForReuse(email); 