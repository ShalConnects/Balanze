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

async function checkActualData() {
  console.log('🔍 Checking actual data for user...');
  
  const testUserId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  try {
    // Check profiles by ID (not user_id)
    console.log('1. Checking profiles by ID...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId);
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else {
      console.log('✅ Profile data:', profile);
    }
    
    // Check if user exists in auth.users (we can't directly query this, but we can check if they can log in)
    console.log('\n2. Checking if user can authenticate...');
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ User has active session:', session.user.id);
    } else {
      console.log('ℹ️ No active session');
    }
    
    // Check all tables for any data
    console.log('\n3. Checking all tables for any data...');
    
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
          if (data && data.length > 0) {
            console.log(`   Sample:`, data[0]);
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkActualData(); 