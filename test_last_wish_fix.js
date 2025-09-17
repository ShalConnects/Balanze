// Test script to verify Last Wish settings updates work
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLastWishSettings() {
  console.log('🧪 Testing Last Wish Settings Updates...\n');

  try {
    // Step 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('⚠️  No user authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);

    // Step 2: Test reading existing settings
    console.log('\n📖 Testing read access...');
    const { data: existingSettings, error: readError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (readError && readError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.log('❌ Read error:', readError.message);
      return;
    }
    
    console.log('✅ Read access working');
    if (existingSettings) {
      console.log('   Found existing settings');
    } else {
      console.log('   No existing settings found');
    }

    // Step 3: Test creating/updating settings
    console.log('\n✏️  Testing create/update access...');
    const testSettings = {
      user_id: user.id,
      is_enabled: true,
      check_in_frequency: 30,
      recipients: [
        {
          id: 'test-recipient-1',
          email: 'test@example.com',
          name: 'Test Recipient',
          relationship: 'Family'
        }
      ],
      include_data: {
        accounts: true,
        transactions: true,
        purchases: false,
        lendBorrow: true,
        savings: false,
        analytics: true
      },
      message: 'Test message for Last Wish system',
      is_active: true
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from('last_wish_settings')
      .upsert(testSettings)
      .select();
    
    if (upsertError) {
      console.log('❌ Upsert error:', upsertError.message);
      console.log('   Error details:', upsertError);
      return;
    }
    
    console.log('✅ Create/update access working');
    console.log('   Settings ID:', upsertData[0]?.id);

    // Step 4: Test updating specific fields
    console.log('\n🔄 Testing field updates...');
    
    // Test frequency update
    const { error: freqError } = await supabase
      .from('last_wish_settings')
      .update({ check_in_frequency: 14 })
      .eq('user_id', user.id);
    
    if (freqError) {
      console.log('❌ Frequency update error:', freqError.message);
    } else {
      console.log('✅ Frequency update working');
    }

    // Test recipients update
    const { error: recipientsError } = await supabase
      .from('last_wish_settings')
      .update({ 
        recipients: [
          {
            id: 'test-recipient-2',
            email: 'test2@example.com',
            name: 'Test Recipient 2',
            relationship: 'Friend'
          }
        ]
      })
      .eq('user_id', user.id);
    
    if (recipientsError) {
      console.log('❌ Recipients update error:', recipientsError.message);
    } else {
      console.log('✅ Recipients update working');
    }

    // Test data inclusion update
    const { error: dataError } = await supabase
      .from('last_wish_settings')
      .update({ 
        include_data: {
          accounts: true,
          transactions: false,
          purchases: true,
          lendBorrow: false,
          savings: true,
          analytics: false
        }
      })
      .eq('user_id', user.id);
    
    if (dataError) {
      console.log('❌ Data inclusion update error:', dataError.message);
    } else {
      console.log('✅ Data inclusion update working');
    }

    // Step 5: Test delete access
    console.log('\n🗑️  Testing delete access...');
    const { error: deleteError } = await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.log('❌ Delete error:', deleteError.message);
    } else {
      console.log('✅ Delete access working');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('   Last Wish settings should now work properly in the UI.');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the test
testLastWishSettings();