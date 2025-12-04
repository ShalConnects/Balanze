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

async function debugDeletionFunction() {
  console.log('🔍 Debugging deletion function...');
  
  try {
    // 1. Check if function exists
    console.log('\n1. Testing if delete_user_completely function exists...');
    const { data: funcTest, error: funcError } = await supabase
      .rpc('delete_user_completely', { user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (funcError) {
      console.log('❌ Function error:', funcError);
    } else {
      console.log('✅ Function exists and can be called:', funcTest);
    }

    // 2. Check what users exist
    console.log('\n2. Checking existing users...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session?.user?.id);
    
    // 3. Check profiles table
    console.log('\n3. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError);
    } else {
      console.log('✅ Profiles found:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('Sample profile:', profiles[0]);
      }
    }

    // 4. Check auth.users table (if possible)
    console.log('\n4. Testing direct auth user deletion...');
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(5);
      
      if (authError) {
        console.log('❌ Cannot access auth.users directly:', authError.message);
      } else {
        console.log('✅ Auth users found:', authUsers?.length || 0);
      }
    } catch (err) {
      console.log('❌ Cannot access auth.users:', err.message);
    }

    // 5. Test with a real user ID if session exists
    if (session?.user?.id) {
      console.log('\n5. Testing with real user ID:', session.user.id);
      
      // First check if user exists in profiles
      const { data: userProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileCheckError) {
        console.log('❌ Profile check error:', profileCheckError);
      } else {
        console.log('✅ User profile found:', userProfile);
        
        // Test the deletion function with real user ID
        console.log('\n6. Testing deletion function with real user...');
        const { data: deletionResult, error: deletionError } = await supabase
          .rpc('delete_user_completely', { user_id: session.user.id });
        
        if (deletionError) {
          console.log('❌ Deletion error:', deletionError);
        } else {
          console.log('✅ Deletion result:', deletionResult);
          
          // Check if profile was actually deleted
          const { data: profileAfter, error: afterError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (afterError) {
            console.log('✅ Profile successfully deleted (not found)');
          } else {
            console.log('❌ Profile still exists after deletion:', profileAfter);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugDeletionFunction(); 