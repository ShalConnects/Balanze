/**
 * Test the exact query that the API uses
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

async function testAPIQuery() {
  console.log('🧪 Testing exact API query...\n');

  try {
    const userId = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    
    console.log('1. Testing the exact query from send-last-wish-email.js API:');
    
    // This is the exact query from the API
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log(`❌ API Query Error: ${settingsError.message}`);
      console.log(`📋 Error Code: ${settingsError.code}`);
      console.log(`📋 Error Details: ${JSON.stringify(settingsError, null, 2)}`);
      
      // Try without .single()
      console.log('\n2. Testing same query without .single():');
      const { data: settingsArray, error: arrayError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', userId);
        
      if (arrayError) {
        console.log(`❌ Array Query Error: ${arrayError.message}`);
      } else {
        console.log(`✅ Array Query Success: Found ${settingsArray.length} record(s)`);
        if (settingsArray.length > 0) {
          console.log('📋 First record recipients:', settingsArray[0].recipients ? 'Present' : 'Missing');
          console.log('📋 First record enabled:', settingsArray[0].is_enabled);
          console.log('📋 First record active:', settingsArray[0].is_active);
        }
      }
    } else {
      console.log('✅ API Query Success!');
      console.log(`📋 Settings ID: ${settings.id}`);
      console.log(`📋 Recipients: ${settings.recipients ? settings.recipients.length : 0}`);
      console.log(`📋 Enabled: ${settings.is_enabled}`);
      console.log(`📋 Active: ${settings.is_active}`);
      
      if (!settings.recipients || settings.recipients.length === 0) {
        console.log('❌ No recipients configured - this would cause the API to fail');
      } else {
        console.log('✅ Recipients configured - API should work');
        console.log('📧 Recipients:', settings.recipients.map(r => r.email));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPIQuery();
