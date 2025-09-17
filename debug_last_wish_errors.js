// Debug script to check Last Wish table status and errors
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLastWishErrors() {
  console.log('🔍 Debugging Last Wish Errors...\n');

  try {
    // Step 1: Check if table exists
    console.log('1. Checking if last_wish_settings table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'last_wish_settings');
    
    if (tableError) {
      console.log('❌ Error checking table existence:', tableError.message);
    } else if (tableCheck && tableCheck.length > 0) {
      console.log('✅ Table exists');
    } else {
      console.log('❌ Table does not exist!');
      return;
    }

    // Step 2: Check table structure
    console.log('\n2. Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'last_wish_settings')
      .order('ordinal_position');
    
    if (columnsError) {
      console.log('❌ Error checking columns:', columnsError.message);
    } else {
      console.log('✅ Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Step 3: Check RLS status
    console.log('\n3. Checking RLS status...');
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'last_wish_settings');
    
    if (rlsError) {
      console.log('❌ Error checking RLS:', rlsError.message);
    } else if (rlsCheck && rlsCheck.length > 0) {
      console.log(`✅ RLS status: ${rlsCheck[0].rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    }

    // Step 4: Check policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'last_wish_settings');
    
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    } else {
      console.log('❌ No RLS policies found!');
    }

    // Step 5: Test basic query (this should work even without auth)
    console.log('\n5. Testing basic query...');
    const { data: basicData, error: basicError } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    if (basicError) {
      console.log('❌ Basic query error:', basicError.message);
      console.log('   Error code:', basicError.code);
      console.log('   Error details:', basicError.details);
    } else {
      console.log('✅ Basic query works');
    }

    // Step 6: Check if we can insert a test record (this will fail due to RLS, but we can see the error)
    console.log('\n6. Testing insert operation...');
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      is_enabled: false,
      check_in_frequency: 30,
      recipients: [],
      include_data: {
        accounts: true,
        transactions: true,
        purchases: true,
        lendBorrow: true,
        savings: true,
        analytics: true
      },
      message: '',
      is_active: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .insert([testRecord]);
    
    if (insertError) {
      console.log('❌ Insert error (expected due to RLS):', insertError.message);
      console.log('   Error code:', insertError.code);
      console.log('   Error details:', insertError.details);
    } else {
      console.log('✅ Insert works (unexpected - RLS might be disabled)');
    }

    // Step 7: Check permissions
    console.log('\n7. Checking table permissions...');
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.table_privileges')
      .select('grantee, privilege_type')
      .eq('table_name', 'last_wish_settings');
    
    if (permError) {
      console.log('❌ Error checking permissions:', permError.message);
    } else if (permissions && permissions.length > 0) {
      console.log('✅ Table permissions:');
      permissions.forEach(perm => {
        console.log(`   - ${perm.grantee}: ${perm.privilege_type}`);
      });
    } else {
      console.log('❌ No permissions found!');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the debug
debugLastWishErrors();
