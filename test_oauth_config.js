import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOAuthConfiguration() {
  console.log('🔍 Testing OAuth Provider Configuration...\n');
  
  // Test Google OAuth
  console.log('📧 Testing Google OAuth...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Google OAuth Error:', error.message);
      console.log('Error Code:', error.status);
      
      if (error.message.includes('provider is not enabled')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to Supabase Dashboard > Authentication > Providers');
        console.log('2. Find Google and click "Edit"');
        console.log('3. Enable the provider');
        console.log('4. Add your Google OAuth credentials:');
        console.log('   - Client ID: from Google Cloud Console');
        console.log('   - Client Secret: from Google Cloud Console');
        console.log('5. Save changes');
      } else if (error.message.includes('redirect_uri_mismatch')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. In Google Cloud Console, add this redirect URI:');
        console.log('   https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback');
        console.log('2. In Supabase, check URL Configuration');
      } else if (error.message.includes('invalid client')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Verify Google OAuth credentials in Supabase');
        console.log('2. Check Client ID and Secret are correct');
      }
    } else {
      console.log('✅ Google OAuth working!');
      console.log('Redirect URL:', data.url);
    }
  } catch (error) {
    console.log('❌ Google OAuth Exception:', error.message);
  }
  
  // Test Apple OAuth
  console.log('\n🍎 Testing Apple OAuth...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Apple OAuth Error:', error.message);
      console.log('Error Code:', error.status);
      
      if (error.message.includes('provider is not enabled')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to Supabase Dashboard > Authentication > Providers');
        console.log('2. Find Apple and click "Edit"');
        console.log('3. Enable the provider');
        console.log('4. Add your Apple OAuth credentials:');
        console.log('   - Client ID: Your Service ID');
        console.log('   - Team ID: Your Apple Team ID');
        console.log('   - Key ID: Your Key ID');
        console.log('   - Private Key: Upload your .p8 file');
        console.log('5. Save changes');
      } else if (error.message.includes('redirect_uri_mismatch')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. In Apple Developer Console, add this domain:');
        console.log('   xgncksougafnfbtusfnf.supabase.co');
        console.log('2. Add redirect URL:');
        console.log('   https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback');
      } else if (error.message.includes('invalid client')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Verify Apple OAuth credentials in Supabase');
        console.log('2. Check Service ID, Team ID, and Key ID');
        console.log('3. Ensure private key file is uploaded correctly');
      }
    } else {
      console.log('✅ Apple OAuth working!');
      console.log('Redirect URL:', data.url);
    }
  } catch (error) {
    console.log('❌ Apple OAuth Exception:', error.message);
  }
  
  console.log('\n📋 COMPLETE SETUP CHECKLIST:');
  console.log('□ Google OAuth enabled in Supabase');
  console.log('□ Google Client ID and Secret added');
  console.log('□ Google redirect URIs configured');
  console.log('□ Apple OAuth enabled in Supabase');
  console.log('□ Apple Service ID, Team ID, Key ID added');
  console.log('□ Apple private key uploaded');
  console.log('□ Apple domain and redirect URLs configured');
  console.log('□ Supabase Site URL set to: http://localhost:5173');
  console.log('□ Supabase redirect URLs include: http://localhost:5173/auth/callback');
  
  console.log('\n🔗 USEFUL LINKS:');
  console.log('- Supabase Dashboard: https://supabase.com/dashboard');
  console.log('- Google Cloud Console: https://console.cloud.google.com/');
  console.log('- Apple Developer Console: https://developer.apple.com/');
}

testOAuthConfiguration(); 