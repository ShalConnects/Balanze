import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
  console.log('🔍 Testing if trigger is working...');
  
  // Test user ID (replace with actual user ID from your test)
  const testUserId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile not found or error:', profileError.message);
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Try to manually delete the profile and see what happens
    console.log('🗑️ Attempting manual profile deletion...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    if (deleteError) {
      console.log('❌ Profile deletion failed:', deleteError);
    } else {
      console.log('✅ Profile deletion succeeded');
      
      // Check if profile still exists
      const { data: profileAfter, error: profileAfterError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      if (profileAfterError) {
        console.log('✅ Profile successfully deleted from profiles table');
      } else {
        console.log('❌ Profile still exists after deletion:', profileAfter);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTrigger(); 