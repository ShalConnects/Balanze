import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthUpdate() {
  console.log('🔍 Testing auth user update...');
  
  const testUserId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  try {
    // First, let's try to call the function and see what happens
    console.log('1. Calling delete_user_native function...');
    const { data, error } = await supabase.rpc('delete_user_native', {
      user_id: testUserId
    });
    
    if (error) {
      console.log('❌ Function error:', error);
    } else {
      console.log('✅ Function returned:', data);
    }
    
    // Now let's try to manually update the auth user
    console.log('\n2. Testing manual auth user update...');
    
    // Try a simple update first
    const { error: updateError } = await supabase
      .from('auth.users')
      .update({ 
        email: 'test_updated@test.com',
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId);
    
    if (updateError) {
      console.log('❌ Manual update error:', updateError);
    } else {
      console.log('✅ Manual update succeeded');
    }
    
    // Check if we can even access auth.users
    console.log('\n3. Testing auth.users access...');
    try {
      const { data: authData, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .eq('id', testUserId)
        .single();
      
      if (authError) {
        console.log('❌ Auth users access error:', authError.message);
      } else {
        console.log('✅ Auth user found:', authData);
      }
    } catch (err) {
      console.log('❌ Auth users access exception:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAuthUpdate(); 