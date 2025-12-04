import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOAuthStatus() {
  console.log('🔍 Checking OAuth Provider Status...\n');
  
  console.log('📋 DIAGNOSIS:');
  console.log('You are getting "provider is not enabled" error in the UI');
  console.log('This means OAuth providers are enabled but missing credentials\n');
  
  console.log('🔧 IMMEDIATE ACTION REQUIRED:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select project: xgncksougafnfbtusfnf');
  console.log('3. Go to: Authentication > Providers');
  console.log('4. Check Google and Apple providers');
  console.log('5. If enabled but no credentials, add them');
  console.log('6. If not enabled, enable them and add credentials\n');
  
  console.log('📧 GOOGLE OAUTH SETUP:');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Create project or select existing');
  console.log('3. Enable Google+ API');
  console.log('4. Create OAuth 2.0 credentials');
  console.log('5. Add redirect URIs:');
  console.log('   - https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback');
  console.log('   - http://localhost:5173/auth/callback');
  console.log('6. Copy Client ID and Secret');
  console.log('7. Add to Supabase Dashboard\n');
  
  console.log('🍎 APPLE OAUTH SETUP:');
  console.log('1. Go to: https://developer.apple.com/');
  console.log('2. Create Service ID with Sign In with Apple');
  console.log('3. Add domain: xgncksougafnfbtusfnf.supabase.co');
  console.log('4. Create OAuth Client and download key file');
  console.log('5. Add to Supabase Dashboard:\n');
  console.log('   - Client ID: Your Service ID');
  console.log('   - Team ID: Your Apple Team ID');
  console.log('   - Key ID: Your Key ID');
  console.log('   - Private Key: Upload .p8 file\n');
  
  console.log('🧪 TESTING CURRENT STATUS...');
  
  // Test Google OAuth
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Google OAuth Error:', error.message);
      if (error.message.includes('provider is not enabled')) {
        console.log('💡 SOLUTION: Add Google OAuth credentials in Supabase Dashboard');
      }
    } else {
      console.log('✅ Google OAuth working!');
    }
  } catch (error) {
    console.log('❌ Google OAuth Exception:', error.message);
  }
  
  // Test Apple OAuth
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Apple OAuth Error:', error.message);
      if (error.message.includes('provider is not enabled')) {
        console.log('💡 SOLUTION: Add Apple OAuth credentials in Supabase Dashboard');
      }
    } else {
      console.log('✅ Apple OAuth working!');
    }
  } catch (error) {
    console.log('❌ Apple OAuth Exception:', error.message);
  }
  
  console.log('\n📖 DETAILED GUIDE:');
  console.log('- Read OAUTH_SETUP_STEPS.md for complete instructions');
  console.log('- Follow each step carefully');
  console.log('- Test after each provider configuration');
  
  console.log('\n🚨 CRITICAL:');
  console.log('The error you\'re seeing means the providers are enabled');
  console.log('but missing the actual OAuth credentials (Client ID, Secret, etc.)');
  console.log('You MUST add these credentials in Supabase Dashboard');
}

checkOAuthStatus(); 