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

async function testSimpleDeletion() {
  console.log('🧪 Testing simple deletion...');
  
  try {
    // Test if we can access basic tables
    console.log('\n1. Testing basic table access...');
    
    const tables = ['notifications', 'transactions', 'accounts', 'profiles'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Test savings_goals specifically
    console.log('\n2. Testing savings_goals...');
    try {
      const { data, error } = await supabase.from('savings_goals').select('*').limit(1);
      if (error) {
        console.log(`❌ savings_goals: ${error.message}`);
      } else {
        console.log(`✅ savings_goals: accessible`);
        if (data && data.length > 0) {
          console.log('Columns:', Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ savings_goals: ${err.message}`);
    }
    
    // Test lend_borrow_returns specifically
    console.log('\n3. Testing lend_borrow_returns...');
    try {
      const { data, error } = await supabase.from('lend_borrow_returns').select('*').limit(1);
      if (error) {
        console.log(`❌ lend_borrow_returns: ${error.message}`);
      } else {
        console.log(`✅ lend_borrow_returns: accessible`);
        if (data && data.length > 0) {
          console.log('Columns:', Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ lend_borrow_returns: ${err.message}`);
    }
    
    // Test profiles specifically
    console.log('\n4. Testing profiles...');
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      if (error) {
        console.log(`❌ profiles: ${error.message}`);
      } else {
        console.log(`✅ profiles: accessible`);
        if (data && data.length > 0) {
          console.log('Columns:', Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ profiles: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSimpleDeletion(); 