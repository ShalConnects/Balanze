const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhnbmtja3NvdWdhZm5mYnR1c2ZuZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NzQ5NzI5LCJleHAiOjIwNTAzMjU3Mjl9.8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppleLogin() {
  console.log('🍎 Testing Apple OAuth configuration...\n');

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'https://balanze.cash/auth/callback'
      }
    });

    if (error) {
      console.log('❌ Apple OAuth Error:', error);
      
      if (error.message.includes('provider is not enabled')) {
        console.log('\n🔧 Fix: Go to Supabase Dashboard → Authentication → Providers → Apple → Enable and add credentials');
      } else if (error.message.includes('redirect_uri_mismatch')) {
        console.log('\n🔧 Fix: Check redirect URIs in Apple Developer Console and Supabase');
      }
    } else {
      console.log('✅ Apple OAuth configured correctly!');
      console.log('📋 Auth URL:', data.url);
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testAppleLogin(); 