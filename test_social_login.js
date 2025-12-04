import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSocialLogin() {
  console.log('=== Testing Social Login Configuration ===\n');
  
  // Test 1: Check if OAuth providers are configured
  console.log('🔍 Testing OAuth Provider Configuration...');
  
  try {
    // Test Google OAuth
    console.log('\n📧 Testing Google OAuth...');
    const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (googleError) {
      console.log('❌ Google OAuth Error:', googleError.message);
      console.log('Status:', googleError.status);
      
      if (googleError.message.includes('provider is not enabled')) {
        console.log('💡 Solution: Enable Google provider in Supabase Dashboard > Authentication > Providers');
      } else if (googleError.message.includes('redirect_uri_mismatch')) {
        console.log('💡 Solution: Check redirect URIs in Google Cloud Console and Supabase');
      } else if (googleError.message.includes('invalid client')) {
        console.log('💡 Solution: Verify Google OAuth credentials in Supabase');
      }
    } else {
      console.log('✅ Google OAuth configured correctly!');
      console.log('Data:', googleData);
      console.log('💡 This will redirect to Google OAuth page');
    }
    
  } catch (error) {
    console.log('❌ Google OAuth Exception:', error.message);
  }
  
  // Test 2: Test Apple OAuth
  try {
    console.log('\n🍎 Testing Apple OAuth...');
    const { data: appleData, error: appleError } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (appleError) {
      console.log('❌ Apple OAuth Error:', appleError.message);
      console.log('Status:', appleError.status);
      
      if (appleError.message.includes('provider is not enabled')) {
        console.log('💡 Solution: Enable Apple provider in Supabase Dashboard > Authentication > Providers');
      } else if (appleError.message.includes('redirect_uri_mismatch')) {
        console.log('💡 Solution: Check redirect URIs in Apple Developer Console and Supabase');
      } else if (appleError.message.includes('invalid client')) {
        console.log('💡 Solution: Verify Apple OAuth credentials in Supabase');
      }
    } else {
      console.log('✅ Apple OAuth configured correctly!');
      console.log('Data:', appleData);
      console.log('💡 This will redirect to Apple Sign-In page');
    }
    
  } catch (error) {
    console.log('❌ Apple OAuth Exception:', error.message);
  }
  
  // Test 3: Check current session
  console.log('\n🔍 Checking current session...');
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session Error:', sessionError.message);
    } else if (session) {
      console.log('✅ User is logged in:', session.user.email);
    } else {
      console.log('ℹ️ No active session (expected for this test)');
    }
  } catch (error) {
    console.log('❌ Session Exception:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\n📝 Next Steps:');
  console.log('1. If providers are not enabled, follow the setup guide');
  console.log('2. Configure OAuth credentials in Supabase Dashboard');
  console.log('3. Test the UI flow in your app');
  console.log('4. Check browser console for any errors');
  
  console.log('\n🔧 Setup Guide:');
  console.log('- Read SOCIAL_LOGIN_SETUP_GUIDE.md for detailed instructions');
  console.log('- Configure Google OAuth in Google Cloud Console');
  console.log('- Configure Apple OAuth in Apple Developer Console');
  console.log('- Add credentials to Supabase Dashboard');
}

testSocialLogin(); 