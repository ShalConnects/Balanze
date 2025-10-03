/**
 * Test the API with the exact same environment setup
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAPIEnvironment() {
  console.log('🔧 Testing API Environment Setup...\n');

  try {
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}`);
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Missing'}`);
    console.log(`SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing'}`);
    
    // Test the exact client creation from the API
    console.log('\n🔗 Testing API client creation...');
    const apiSupabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    console.log(`📊 Using URL: ${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL}`);
    
    const userId = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
    
    // Test the exact query from the API
    console.log('\n📋 Testing API query with API client...');
    const { data: settings, error: settingsError } = await apiSupabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log(`❌ API Client Query Error: ${settingsError.message}`);
      console.log(`📋 Error Code: ${settingsError.code}`);
      
      // Test if it's a permissions issue
      console.log('\n🔐 Testing basic table access...');
      const { data: testData, error: testError } = await apiSupabase
        .from('last_wish_settings')
        .select('count')
        .limit(1);
        
      if (testError) {
        console.log(`❌ Basic access failed: ${testError.message}`);
        console.log('💡 This suggests a permissions or connection issue');
      } else {
        console.log('✅ Basic table access works');
        console.log('💡 The issue might be with the specific query or user ID');
      }
    } else {
      console.log('✅ API Client Query Success!');
      console.log(`📋 Settings found with ${settings.recipients?.length || 0} recipients`);
    }

    // Test the user profile query too (since that's also in the API)
    console.log('\n👤 Testing user profile query...');
    const { data: user, error: userError } = await apiSupabase.auth.admin.getUserById(userId);
    if (userError) {
      console.log(`❌ User Profile Error: ${userError.message}`);
    } else {
      console.log(`✅ User Profile Success: ${user.user?.email || 'No email'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPIEnvironment();
