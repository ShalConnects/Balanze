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

async function testTriggerSimple() {
  console.log('🧪 Testing trigger with a simple profile...');
  
  const testUserId = 'test-trigger-' + Date.now();
  
  try {
    // 1. Create a test profile
    console.log('📝 Creating test profile...');
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        full_name: 'Test User',
        local_currency: 'USD',
        selected_currencies: ['USD'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError) {
      console.log('❌ Cannot create test profile:', createError.message);
      return;
    }
    
    console.log('✅ Test profile created');
    
    // 2. Verify it exists
    const { data: profile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (checkError) {
      console.log('❌ Cannot find created profile:', checkError.message);
      return;
    }
    
    console.log('✅ Profile verified:', profile.id);
    
    // 3. Delete the profile
    console.log('🗑️ Deleting test profile...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    if (deleteError) {
      console.log('❌ Cannot delete profile:', deleteError.message);
      return;
    }
    
    console.log('✅ Profile deleted');
    
    // 4. Check if it's gone
    const { data: profileAfter, error: afterError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (afterError) {
      console.log('✅ Profile successfully removed from profiles table');
    } else {
      console.log('❌ Profile still exists after deletion:', profileAfter);
    }
    
    console.log('🎯 Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTriggerSimple(); 