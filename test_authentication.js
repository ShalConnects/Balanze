import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthentication() {
  console.log('=== TESTING AUTHENTICATION AND RLS POLICIES ===\n');

  try {
    // Step 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('accounts')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Step 2: Check current authentication status
    console.log('\n2. Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
    } else if (!user) {
      console.log('⚠️  No user authenticated');
      console.log('   You need to be logged in to test account creation');
      return;
    } else {
      console.log('✅ User authenticated:', user.email);
      console.log('   User ID:', user.id);
    }

    // Step 3: Test account creation
    console.log('\n3. Testing account creation...');
    const testAccountData = {
      name: 'Test Account ' + Date.now(),
      type: 'checking',
      initial_balance: 100.00,
      currency: 'USD',
      is_active: true,
      description: 'Test account for RLS verification'
    };

    console.log('   Attempting to create account:', testAccountData.name);
    
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert([testAccountData])
      .select()
      .single();

    if (createError) {
      console.log('❌ Account creation failed:', createError.message);
      console.log('   Error details:', createError);
      
      // Check if it's an RLS policy issue
      if (createError.message.includes('row-level security policy')) {
        console.log('\n🔍 This appears to be an RLS policy issue.');
        console.log('   Please run the fix_rls_account_insert.sql script in your Supabase SQL editor.');
      }
    } else {
      console.log('✅ Account created successfully!');
      console.log('   Account ID:', newAccount.id);
      console.log('   Account Name:', newAccount.name);
      
      // Clean up test account
      console.log('\n4. Cleaning up test account...');
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', newAccount.id);
      
      if (deleteError) {
        console.log('⚠️  Failed to clean up test account:', deleteError.message);
      } else {
        console.log('✅ Test account cleaned up');
      }
    }

    // Step 4: Test fetching accounts
    console.log('\n5. Testing account retrieval...');
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .limit(5);

    if (fetchError) {
      console.log('❌ Failed to fetch accounts:', fetchError.message);
    } else {
      console.log('✅ Successfully fetched accounts');
      console.log('   Number of accounts:', accounts.length);
      if (accounts.length > 0) {
        console.log('   Sample account:', {
          id: accounts[0].id,
          name: accounts[0].name,
          type: accounts[0].type,
          user_id: accounts[0].user_id
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuthentication().then(() => {
  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 