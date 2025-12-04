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

async function debugFunctionCall() {
  console.log('🔍 Debugging database function call...');
  
  const testUserId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  try {
    // 1. Check if function exists
    console.log('1. Checking if function exists...');
    try {
      const { data, error } = await supabase.rpc('delete_user_completely_direct', {
        user_id: testUserId
      });
      
      if (error) {
        console.log('❌ Function call error:', error);
        
        // Check if function doesn't exist
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('❌ Function does not exist! You need to run DIRECT_AUTH_DELETION.sql first');
          return;
        }
      } else {
        console.log('✅ Function exists and returned:', data);
      }
    } catch (err) {
      console.log('❌ Function call exception:', err.message);
    }
    
    // 2. Check what data exists for this user
    console.log('\n2. Checking user data...');
    
    const tables = [
      'profiles',
      'accounts', 
      'transactions',
      'purchases',
      'lend_borrow',
      'notifications',
      'audit_logs'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', testUserId);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // 3. Check profile specifically
    console.log('\n3. Checking profile...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId);
      
      if (error) {
        console.log('❌ Profile check error:', error.message);
      } else {
        console.log('✅ Profile found:', data?.length || 0, 'records');
        if (data && data.length > 0) {
          console.log('   Profile data:', data[0]);
        }
      }
    } catch (err) {
      console.log('❌ Profile check exception:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFunctionCall(); 