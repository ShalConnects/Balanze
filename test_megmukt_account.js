// =====================================================
// TEST SCRIPT FOR megmukt@gmail.com ACCOUNT
// =====================================================
// This script tests the account creation and login process

import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_EMAIL = 'megmukt@gmail.com';
const TEST_PASSWORD = 'New12###';

async function testAccountCreation() {
    console.log('=== TESTING ACCOUNT CREATION ===');
    
    try {
        // First, try to sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            options: {
                data: {
                    full_name: 'Test User'
                }
            }
        });

        if (signUpError) {
            console.error('Sign up error:', signUpError.message);
            
            // If user already exists, try to sign in instead
            if (signUpError.message.includes('already registered') || 
                signUpError.message.includes('already exists')) {
                console.log('User already exists, testing sign in...');
                return await testAccountLogin();
            }
            return false;
        }

        console.log('✅ Account created successfully:', signUpData.user?.id);
        return true;

    } catch (error) {
        console.error('Unexpected error during sign up:', error);
        return false;
    }
}

async function testAccountLogin() {
    console.log('=== TESTING ACCOUNT LOGIN ===');
    
    try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (signInError) {
            console.error('Sign in error:', signInError.message);
            return false;
        }

        console.log('✅ Login successful:', signInData.user?.id);
        return signInData.user;

    } catch (error) {
        console.error('Unexpected error during sign in:', error);
        return false;
    }
}

async function testProfileCreation(user) {
    console.log('=== TESTING PROFILE CREATION ===');
    
    try {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError);
            return false;
        }

        if (profile) {
            console.log('✅ Profile exists:', profile);
        } else {
            console.log('⚠️ Profile not found, creating one...');
            
            // Create profile manually
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    full_name: 'Test User',
                    local_currency: 'USD',
                    role: 'user',
                    subscription: { plan: 'free', status: 'active', validUntil: null }
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                return false;
            }

            console.log('✅ Profile created:', newProfile);
        }

        return true;

    } catch (error) {
        console.error('Unexpected error during profile test:', error);
        return false;
    }
}

async function testNewUserExperience(user) {
    console.log('=== TESTING NEW USER EXPERIENCE ===');
    
    try {
        // Check accounts (should be empty for new user)
        const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id);

        if (accountsError) {
            console.error('Error fetching accounts:', accountsError);
            return false;
        }

        console.log(`📊 Accounts count: ${accounts.length} (should be 0 for new user)`);

        // Check transactions (should be empty for new user)
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id);

        if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return false;
        }

        console.log(`📊 Transactions count: ${transactions.length} (should be 0 for new user)`);

        // Check if this looks like a new user
        const isNewUser = accounts.length === 0 && transactions.length === 0;
        console.log(`🎯 New user experience: ${isNewUser ? '✅ YES' : '❌ NO'}`);

        return isNewUser;

    } catch (error) {
        console.error('Unexpected error during new user test:', error);
        return false;
    }
}

async function runFullTest() {
    console.log('🚀 Starting full test for megmukt@gmail.com account...\n');
    
    // Test 1: Account creation/login
    const user = await testAccountCreation();
    if (!user) {
        console.log('❌ Account creation/login failed');
        return;
    }
    
    console.log('');
    
    // Test 2: Profile creation
    const profileOk = await testProfileCreation(user);
    if (!profileOk) {
        console.log('❌ Profile test failed');
        return;
    }
    
    console.log('');
    
    // Test 3: New user experience
    const newUserOk = await testNewUserExperience(user);
    if (!newUserOk) {
        console.log('❌ New user experience test failed');
        return;
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The account is ready for testing the new user experience.');
    console.log(`Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('Signed out successfully.');
}

// Run the test
runFullTest().catch(console.error);
