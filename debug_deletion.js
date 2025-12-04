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

async function debugDeletion() {
  console.log('🔍 Debugging deletion issue...');
  
  try {
    // 1. Check if the function exists
    console.log('\n1. Checking if delete_user_completely function exists...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'delete_user_completely');
    
    if (funcError) {
      console.log('❌ Error checking functions:', funcError);
    } else {
      console.log('✅ Functions found:', functions);
    }

    // 2. Check what tables exist and their columns
    console.log('\n2. Checking table structure...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['savings_goals', 'lend_borrow_returns', 'profiles']);
    
    if (tableError) {
      console.log('❌ Error checking tables:', tableError);
    } else {
      console.log('✅ Tables found:', tables);
    }

    // 3. Check savings_goals columns
    console.log('\n3. Checking savings_goals columns...');
    const { data: savingsColumns, error: savingsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'savings_goals')
      .eq('table_schema', 'public');
    
    if (savingsError) {
      console.log('❌ Error checking savings_goals:', savingsError);
    } else {
      console.log('✅ Savings_goals columns:', savingsColumns);
    }

    // 4. Check lend_borrow_returns columns
    console.log('\n4. Checking lend_borrow_returns columns...');
    const { data: returnsColumns, error: returnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'lend_borrow_returns')
      .eq('table_schema', 'public');
    
    if (returnsError) {
      console.log('❌ Error checking lend_borrow_returns:', returnsError);
    } else {
      console.log('✅ Lend_borrow_returns columns:', returnsColumns);
    }

    // 5. Check profiles columns
    console.log('\n5. Checking profiles columns...');
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (profilesError) {
      console.log('❌ Error checking profiles:', profilesError);
    } else {
      console.log('✅ Profiles columns:', profilesColumns);
    }

    // 6. Try to call the function with a test
    console.log('\n6. Testing function call...');
    const { data: testResult, error: testError } = await supabase
      .rpc('delete_user_completely', { user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (testError) {
      console.log('❌ Function call error:', testError);
    } else {
      console.log('✅ Function call result:', testResult);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugDeletion(); 