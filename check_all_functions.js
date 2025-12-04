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

async function checkAllFunctions() {
  console.log('🔍 Checking all deletion functions...');
  
  const functions = [
    'delete_user_completely',
    'delete_user_completely_direct', 
    'delete_user_simple',
    'delete_user_final',
    'delete_user_admin',
    'delete_user_trigger_based'
  ];
  
  for (const funcName of functions) {
    try {
      console.log(`\nTesting ${funcName}...`);
      const { data, error } = await supabase.rpc(funcName, {
        user_id: 'test-user-id'
      });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${funcName}: Function does not exist`);
        } else {
          console.log(`❌ ${funcName}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${funcName}: Function exists and returned ${data}`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: ${err.message}`);
    }
  }
  
  console.log('\n🎯 Summary: Check which functions exist and which one is being called');
}

checkAllFunctions(); 