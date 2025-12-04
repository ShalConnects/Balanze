import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseDataIssue() {
  console.log('=== DIAGNOSING DATA ISSUE ===\n');
  
  try {
    // Test 1: Check if we can access any data
    console.log('1. Testing basic data access...');
    
    const tables = ['transactions', 'purchases', 'accounts'];
    
    for (const tableName of tables) {
      console.log(`\nChecking ${tableName}...`);
      
      // Try to get any data
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Details: ${error.details}`);
      } else {
        console.log(`   ✅ Success: Found ${count || 0} records`);
        if (data && data.length > 0) {
          console.log(`   Sample data: ${JSON.stringify(data[0], null, 2)}`);
        }
      }
    }
    
    // Test 2: Check if this is an RLS issue
    console.log('\n2. Testing RLS policies...');
    
    // Try to insert a test record to see if RLS blocks it
    const { data: insertTest, error: insertError } = await supabase
      .from('transactions')
      .insert({
        transaction_id: 'TEST123',
        description: 'Test transaction',
        amount: 100,
        type: 'expense',
        date: '2024-01-01'
      })
      .select();
    
    if (insertError) {
      console.log(`   ❌ Insert blocked: ${insertError.message}`);
      console.log(`   This suggests RLS is preventing access to data`);
    } else {
      console.log(`   ✅ Insert successful: ${insertTest[0].transaction_id}`);
      
      // Clean up
      await supabase
        .from('transactions')
        .delete()
        .eq('transaction_id', 'TEST123');
    }
    
    // Test 3: Check if we're in the right environment
    console.log('\n3. Environment check...');
    console.log(`   Supabase URL: ${supabaseUrl}`);
    console.log(`   API Key: ${supabaseAnonKey.substring(0, 20)}...`);
    
    // Test 4: Check if your app is using different credentials
    console.log('\n4. Checking your app configuration...');
    console.log('   Please check your app\'s .env file or configuration for:');
    console.log('   - VITE_SUPABASE_URL');
    console.log('   - VITE_SUPABASE_ANON_KEY');
    console.log('   Make sure these match the values above.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

diagnoseDataIssue(); 