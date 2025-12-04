import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testManualProfileCreation() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log('🧪 Testing manual profile creation...');
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

    // Step 2: Try to manually create a profile
    console.log('\n2️⃣ Manually creating profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signupData.user.id,
        full_name: 'Test User',
        local_currency: 'USD',
        role: 'user',
        subscription: { plan: 'free', status: 'active', validUntil: null },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      console.error('Error details:', profileError);
    } else {
      console.log('✅ Profile created successfully:', profileData);
    }

    // Step 3: Verify profile exists
    console.log('\n3️⃣ Verifying profile exists...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying profile:', verifyError.message);
    } else {
      console.log('✅ Profile verified:', verifyProfile);
    }

    // Step 4: Clean up
    console.log('\n4️⃣ Cleaning up...');
    await supabase.auth.signOut();
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

testManualProfileCreation(); 