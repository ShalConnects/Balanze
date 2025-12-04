// Test Last Wish without authentication to verify RLS fix
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLastWishNoAuth() {
  console.log('🧪 Testing Last Wish without authentication...\n');

  try {
    // Test 1: Basic query
    console.log('1. Testing basic query...');
    const { data: basicData, error: basicError } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    if (basicError) {
      console.log('❌ Basic query error:', basicError.message);
      return;
    }
    console.log('✅ Basic query works');

    // Test 2: Try to insert a test record
    console.log('\n2. Testing insert operation...');
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      is_enabled: false,
      check_in_frequency: 30,
      recipients: [],
      include_data: {
        accounts: true,
        transactions: true,
        purchases: true,
        lendBorrow: true,
        savings: true,
        analytics: true
      },
      message: 'Test record',
      is_active: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .insert([testRecord]);
    
    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
      console.log('   Error code:', insertError.code);
      if (insertError.code === '42501') {
        console.log('   → This is an RLS permission error');
      }
    } else {
      console.log('✅ Insert works - RLS is properly configured');
      console.log('   Inserted record ID:', insertData[0]?.id);
      
      // Clean up the test record
      await supabase
        .from('last_wish_settings')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   Test record cleaned up');
    }

    // Test 3: Try to update a record
    console.log('\n3. Testing update operation...');
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({ check_in_frequency: 14 })
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
    
    if (updateError) {
      console.log('❌ Update error:', updateError.message);
      console.log('   Error code:', updateError.code);
    } else {
      console.log('✅ Update works - RLS is properly configured');
    }

    // Test 4: Try to delete a record
    console.log('\n4. Testing delete operation...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log('❌ Delete error:', deleteError.message);
      console.log('   Error code:', deleteError.code);
    } else {
      console.log('✅ Delete works - RLS is properly configured');
    }

    console.log('\n📋 SUMMARY:');
    console.log('If you see "RLS permission error" (42501), the RLS policies need to be fixed.');
    console.log('If you see "✅ Insert/Update/Delete works", the RLS is properly configured.');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the test
testLastWishNoAuth();
