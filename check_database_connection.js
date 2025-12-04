import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseConnection() {
  console.log('=== CHECKING DATABASE CONNECTION ===\n');
  
  try {
    // Test 1: Check if we can connect at all
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection error:', testError.message);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Test 2: Check if tables exist by trying to get their structure
    console.log('\n2. Checking table structures...');
    
    const tables = ['transactions', 'purchases', 'accounts', 'transaction_history'];
    
    for (const tableName of tables) {
      console.log(`   Checking ${tableName}...`);
      
      // Try to get one row to see structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${tableName}: Table exists`);
        if (data && data.length > 0) {
          console.log(`   📊 ${tableName}: Has ${data.length} row(s)`);
          console.log(`   📋 ${tableName} columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log(`   📊 ${tableName}: Empty table`);
        }
      }
    }
    
    // Test 3: Try to get any data from any table
    console.log('\n3. Looking for any data...');
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (!error && data && data.length > 0) {
        console.log(`   ✅ Found ${data.length} records in ${tableName}`);
        console.log(`   Sample: ${JSON.stringify(data[0], null, 2)}`);
        break;
      }
    }
    
    // Test 4: Check if this is the right database
    console.log('\n4. Database info:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);
    
    console.log('\nIf no data is found, please check:');
    console.log('1. Are you using the correct Supabase project?');
    console.log('2. Is your app data in a different environment?');
    console.log('3. Are there RLS policies blocking access?');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseConnection(); 