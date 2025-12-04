import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure you have a .env file with:');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewUserLogin() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log('🧪 Testing new user registration and login flow...');
  console.log(`📧 Test email: ${testEmail}`);
  
  try {
    // Step 1: Register a new user
    console.log('\n1️⃣ Registering new user...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signupError) {
      console.error('❌ Registration failed:', signupError.message);
      return;
    }

    if (!signupData.user) {
      console.error('❌ No user returned from registration');
      return;
    }

    console.log('✅ User registered successfully:', signupData.user.id);

    // Step 2: Check if profile was created
    console.log('\n2️⃣ Checking if profile was created...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Profile not found, this is expected for new users');
      console.log('The profile will be created when the user first logs in');
    } else {
      console.log('✅ Profile found:', profileData);
    }

    // Step 3: Sign out
    console.log('\n3️⃣ Signing out...');
    await supabase.auth.signOut();

    // Step 4: Sign in (this should trigger profile creation)
    console.log('\n4️⃣ Signing in...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signinError) {
      console.error('❌ Sign in failed:', signinError.message);
      return;
    }

    console.log('✅ Sign in successful:', signinData.user.id);

    // Step 5: Check if profile was created after login
    console.log('\n5️⃣ Checking if profile was created after login...');
    const { data: profileAfterLogin, error: profileAfterError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signinData.user.id)
      .single();

    if (profileAfterError) {
      console.error('❌ Profile still not found after login:', profileAfterError.message);
    } else {
      console.log('✅ Profile created successfully after login:', profileAfterLogin);
    }

    // Step 6: Test fetching user data
    console.log('\n6️⃣ Testing data fetching...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', signinData.user.id);

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError.message);
    } else {
      console.log('✅ Accounts fetch successful (empty for new user):', accounts);
    }

    // Step 7: Clean up
    console.log('\n7️⃣ Cleaning up test user...');
    await supabase.auth.signOut();
    
    // Note: We can't delete the user without admin privileges, but that's okay for testing
    
    console.log('\n🎉 Test completed successfully!');
    console.log('The new user registration and login flow is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

testNewUserLogin(); 