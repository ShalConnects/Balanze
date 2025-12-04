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

async function debugFunctionDetailed() {
  console.log('🔍 Detailed function debugging...');
  
  const testUserId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  try {
    // 1. Check if the function exists and what it returns
    console.log('1. Testing function call...');
    const { data, error } = await supabase.rpc('delete_user_simple', {
      user_id: testUserId
    });
    
    if (error) {
      console.log('❌ Function error:', error);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Function returned:', data);
    }
    
    // 2. Check if user exists in auth (we can't directly query auth.users, but we can check session)
    console.log('\n2. Checking authentication state...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError);
    } else if (session) {
      console.log('✅ Active session found for user:', session.user.id);
      console.log('   Email:', session.user.email);
      console.log('   Created at:', session.user.created_at);
    } else {
      console.log('ℹ️ No active session');
    }
    
    // 3. Try to manually delete profile first
    console.log('\n3. Testing manual profile deletion...');
    try {
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);
      
      if (profileDeleteError) {
        console.log('❌ Profile deletion error:', profileDeleteError.message);
      } else {
        console.log('✅ Profile deletion succeeded');
      }
    } catch (err) {
      console.log('❌ Profile deletion exception:', err.message);
    }
    
    // 4. Check what data exists for this user
    console.log('\n4. Checking user data...');
    const tables = [
      'accounts', 
      'transactions',
      'purchases',
      'lend_borrow',
      'notifications',
      'audit_logs',
      'donation_saving_records',
      'purchase_attachments',
      'purchase_categories'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', testUserId);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // 5. Try a different approach - use admin functions if available
    console.log('\n5. Checking for admin functions...');
    try {
      // Try to use admin.deleteUser if available
      const { error: adminError } = await supabase.auth.admin.deleteUser(testUserId);
      if (adminError) {
        console.log('❌ Admin delete error:', adminError.message);
      } else {
        console.log('✅ Admin delete succeeded!');
      }
    } catch (err) {
      console.log('❌ Admin delete not available:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFunctionDetailed(); 