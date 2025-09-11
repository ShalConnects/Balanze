import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUIOAuth() {
  console.log('🔍 Testing OAuth exactly as UI does...\n');
  
  // Simulate what the UI does
  const windowLocationOrigin = 'http://localhost:5173';
  const redirectTo = `${windowLocationOrigin}/auth/callback`;
  
  console.log('📍 Using redirect URL:', redirectTo);
  console.log('🌐 Window location origin:', windowLocationOrigin);
  
  // Test Google OAuth (exactly as authStore does)
  console.log('\n📧 Testing Google OAuth (UI method)...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo
      }
    });
    
    if (error) {
      console.log('❌ Google OAuth Error:', error.message);
      console.log('Error Code:', error.status);
      console.log('Full Error:', JSON.stringify(error, null, 2));
      
      if (error.message.includes('provider is not enabled')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to Supabase Dashboard > Authentication > Providers');
        console.log('2. Find Google and click "Edit"');
        console.log('3. Enable the provider');
        console.log('4. Add your Google OAuth credentials');
        console.log('5. Save changes');
      }
    } else {
      console.log('✅ Google OAuth working!');
      console.log('Redirect URL:', data.url);
    }
  } catch (error) {
    console.log('❌ Google OAuth Exception:', error.message);
  }
  
  // Test Apple OAuth (exactly as authStore does)
  console.log('\n🍎 Testing Apple OAuth (UI method)...');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectTo
      }
    });
    
    if (error) {
      console.log('❌ Apple OAuth Error:', error.message);
      console.log('Error Code:', error.status);
      console.log('Full Error:', JSON.stringify(error, null, 2));
      
      if (error.message.includes('provider is not enabled')) {
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to Supabase Dashboard > Authentication > Providers');
        console.log('2. Find Apple and click "Edit"');
        console.log('3. Enable the provider');
        console.log('4. Add your Apple OAuth credentials');
        console.log('5. Save changes');
      }
    } else {
      console.log('✅ Apple OAuth working!');
      console.log('Redirect URL:', data.url);
    }
  } catch (error) {
    console.log('❌ Apple OAuth Exception:', error.message);
  }
  
  // Test with different redirect URLs
  console.log('\n🔄 Testing with different redirect URLs...');
  
  const testUrls = [
    'http://localhost:5173/auth/callback',
    'https://xgncksougafnfbtusfnf.supabase.co/auth/v1/callback',
    'http://localhost:3000/auth/callback'
  ];
  
  for (const testUrl of testUrls) {
    console.log(`\nTesting with: ${testUrl}`);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: testUrl
        }
      });
      
      if (error) {
        console.log(`❌ Error with ${testUrl}:`, error.message);
      } else {
        console.log(`✅ Working with ${testUrl}`);
      }
    } catch (error) {
      console.log(`❌ Exception with ${testUrl}:`, error.message);
    }
  }
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('If you see "provider is not enabled" errors:');
  console.log('1. The OAuth providers are NOT configured in Supabase');
  console.log('2. You need to add credentials in Supabase Dashboard');
  console.log('3. Follow the step-by-step guide above');
  
  console.log('\n🔗 QUICK FIX:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project: xgncksougafnfbtusfnf');
  console.log('3. Go to: Authentication > Providers');
  console.log('4. Enable Google and Apple providers');
  console.log('5. Add your OAuth credentials');
}

testUIOAuth(); 