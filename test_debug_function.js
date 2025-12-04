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

async function testDebugFunction() {
  console.log('🔍 Testing debug function...');
  
  const testUserId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  try {
    // Call the debug function
    const { data, error } = await supabase.rpc('debug_delete_user', {
      user_id: testUserId
    });
    
    if (error) {
      console.log('❌ Debug function error:', error);
    } else {
      console.log('✅ Debug function result:');
      console.log(data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDebugFunction(); 