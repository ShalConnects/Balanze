/**
 * Test Last Wish Database Connection
 * 
 * This script tests the database connection and table structure for Last Wish
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDatabaseConnection() {
  console.log('🔍 Testing Last Wish Database Connection...');
  console.log('=' .repeat(50));
  
  try {
    // Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test table structure
    console.log('\n2️⃣ Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Table structure test failed:', structureError);
      return false;
    }
    
    console.log('✅ Table structure is accessible');
    
    // Test insert/update operation
    console.log('\n3️⃣ Testing insert/update operation...');
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format
    const testRecord = {
      user_id: testUserId,
      is_enabled: true,
      check_in_frequency: 5,
      last_check_in: new Date().toISOString(),
      recipients: [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test Recipient',
          relationship: 'Test'
        }
      ],
      include_data: {
        accounts: true,
        transactions: true,
        purchases: true,
        lendBorrow: true,
        savings: true,
        analytics: true
      },
      message: 'Test message',
      is_active: true,
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .upsert(testRecord);
    
    if (insertError) {
      console.error('❌ Insert/update test failed:', insertError);
      return false;
    }
    
    console.log('✅ Insert/update operation successful');
    
    // Clean up test data
    console.log('\n4️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', testUserId);
    
    if (deleteError) {
      console.warn('⚠️ Cleanup failed (non-critical):', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 All database tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n✅ Last Wish database is ready to use!');
  } else {
    console.log('\n❌ Database issues detected. Please check your configuration.');
  }
});
