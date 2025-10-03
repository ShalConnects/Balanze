/**
 * Simple test to check just the database function
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testDatabaseFunction() {
  console.log('🔧 Testing Database Function Only...\n');

  try {
    // Test 1: Check if function exists
    console.log('1. Testing function existence...');
    const { data, error } = await supabase.rpc('check_overdue_last_wish');
    
    if (error) {
      console.log(`❌ Function Error: ${error.message}`);
      console.log(`📋 Error Details: ${JSON.stringify(error, null, 2)}`);
      
      // Check if it's a specific type of error
      if (error.message.includes('does not exist')) {
        console.log('💡 Solution: The function doesn\'t exist. Run fix_database_function_final.sql');
      } else if (error.message.includes('structure of query does not match')) {
        console.log('💡 Solution: Type mismatch. Run fix_database_function_final.sql');
      } else if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('💡 Solution: Missing column. Run fix_last_wish_delivery_triggered.sql first');
      }
    } else {
      console.log(`✅ Function Works: Found ${Array.isArray(data) ? data.length : 0} overdue users`);
      if (Array.isArray(data) && data.length > 0) {
        console.log('📊 Sample result:', JSON.stringify(data[0], null, 2));
      }
    }

    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('last_wish_settings')
      .select('user_id, is_enabled, is_active, delivery_triggered, last_check_in, check_in_frequency')
      .limit(1);

    if (tableError) {
      console.log(`❌ Table Error: ${tableError.message}`);
    } else {
      console.log('✅ Table Structure: OK');
      if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        console.log(`📋 Available columns: ${columns.join(', ')}`);
        
        // Check for required columns
        const requiredColumns = ['delivery_triggered', 'is_enabled', 'is_active', 'last_check_in', 'check_in_frequency'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
        } else {
          console.log('✅ All required columns present');
        }
      }
    }

    // Test 3: Manual query (what the function should do)
    console.log('\n3. Testing manual query...');
    try {
      const { data: manualData, error: manualError } = await supabase
        .from('last_wish_settings')
        .select(`
          user_id,
          is_enabled,
          is_active,
          delivery_triggered,
          last_check_in,
          check_in_frequency
        `)
        .eq('is_enabled', true)
        .eq('is_active', true);

      if (manualError) {
        console.log(`❌ Manual Query Error: ${manualError.message}`);
      } else {
        console.log(`✅ Manual Query: Found ${manualData.length} enabled settings`);
        
        // Filter for overdue manually
        const now = new Date();
        const overdueUsers = manualData.filter(record => {
          if (!record.last_check_in) return false;
          const lastCheckIn = new Date(record.last_check_in);
          const nextCheckIn = new Date(lastCheckIn.getTime() + (record.check_in_frequency * 24 * 60 * 60 * 1000));
          const isOverdue = now > nextCheckIn;
          const notDelivered = !record.delivery_triggered;
          return isOverdue && notDelivered;
        });
        
        console.log(`📊 Overdue users (manual calculation): ${overdueUsers.length}`);
      }
    } catch (manualQueryError) {
      console.log(`❌ Manual Query Failed: ${manualQueryError.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('1. If function errors persist, run: fix_database_function_final.sql');
  console.log('2. If table columns are missing, run: fix_last_wish_delivery_triggered.sql');
  console.log('3. Then test again with: node test_database_function_only.js');
}

// Run the test
testDatabaseFunction();
