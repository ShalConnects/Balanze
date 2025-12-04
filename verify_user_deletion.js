import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyUserDeletion(userId, originalEmail) {
  console.log('🔍 === VERIFYING USER DELETION ===');
  console.log(`User ID: ${userId}`);
  console.log(`Original Email: ${originalEmail}`);
  console.log('');

  const results = {
    authUser: null,
    profile: null,
    customTables: {},
    orphanedData: []
  };

  try {
    // 1. Check Auth User Status
    console.log('1️⃣ Checking Auth User Status...');
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, encrypted_password, raw_user_meta_data, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (authError) {
      console.log('❌ Error checking auth user:', authError.message);
    } else if (authUser) {
      results.authUser = authUser;
      console.log('✅ Auth user found (should be disabled):');
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Password: ${authUser.encrypted_password ? 'SET' : 'CLEARED'}`);
      console.log(`   Metadata: ${authUser.raw_user_meta_data}`);
      console.log(`   Updated: ${authUser.updated_at}`);
    } else {
      console.log('❌ Auth user not found (completely deleted)');
    }

    // 2. Check Profile
    console.log('\n2️⃣ Checking Profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      console.log('✅ Profile deleted successfully');
      results.profile = null;
    } else if (profile) {
      console.log('❌ Profile still exists:', profile);
      results.profile = profile;
    } else {
      console.log('✅ Profile deleted successfully');
      results.profile = null;
    }

    // 3. Check All Custom Tables
    console.log('\n3️⃣ Checking Custom Tables...');
    const tablesToCheck = [
      'accounts',
      'transactions',
      'purchases',
      'purchase_categories',
      'purchase_attachments',
      'lend_borrow',
      'lend_borrow_returns',
      'savings_goals',
      'donation_saving_records',
      'notifications',
      'audit_logs',
      'last_wish_settings',
      'last_wish_deliveries'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.log(`   ⚠️  ${table}: Error checking (${error.message})`);
          results.customTables[table] = { error: error.message };
        } else if (data && data.length > 0) {
          console.log(`   ❌ ${table}: ${data.length} records found`);
          results.customTables[table] = { count: data.length, records: data };
        } else {
          console.log(`   ✅ ${table}: 0 records (clean)`);
          results.customTables[table] = { count: 0 };
        }
      } catch (error) {
        console.log(`   ⚠️  ${table}: Exception (${error.message})`);
        results.customTables[table] = { error: error.message };
      }
    }

    // 4. Check for Orphaned Data (by email)
    console.log('\n4️⃣ Checking for Orphaned Data by Email...');
    const emailPatterns = [
      originalEmail,
      originalEmail.toLowerCase(),
      originalEmail.toUpperCase(),
      `%${originalEmail.split('@')[0]}%` // Partial email match
    ];

    for (const pattern of emailPatterns) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .ilike('email', pattern);

        if (!error && data && data.length > 0) {
          console.log(`   ⚠️  Found profiles with email pattern "${pattern}":`, data.length);
          results.orphanedData.push(...data);
        }
      } catch (error) {
        // Ignore errors for email pattern searches
      }
    }

    // 5. Check Registration Attempt
    console.log('\n5️⃣ Testing Registration with Same Email...');
    try {
      const { data: regData, error: regError } = await supabase.auth.signUp({
        email: originalEmail,
        password: 'TestPassword123!'
      });

      if (regError) {
        console.log(`   ✅ Registration blocked: ${regError.message}`);
      } else {
        console.log('   ❌ Registration succeeded (should be blocked)');
        console.log('   User created:', regData.user?.id);
      }
    } catch (error) {
      console.log(`   ✅ Registration blocked: ${error.message}`);
    }

    // 6. Summary Report
    console.log('\n📊 === DELETION VERIFICATION SUMMARY ===');
    
    // Auth User Status
    if (results.authUser) {
      const isDisabled = results.authUser.email.includes('deleted_') && 
                        !results.authUser.encrypted_password;
      console.log(`🔐 Auth User: ${isDisabled ? 'DISABLED ✅' : 'ACTIVE ❌'}`);
    } else {
      console.log('🔐 Auth User: DELETED ✅');
    }

    // Profile Status
    console.log(`👤 Profile: ${results.profile ? 'EXISTS ❌' : 'DELETED ✅'}`);

    // Custom Tables Status
    const tablesWithData = Object.entries(results.customTables)
      .filter(([table, result]) => result.count > 0)
      .map(([table, result]) => `${table}: ${result.count} records`);

    if (tablesWithData.length === 0) {
      console.log('🗄️  Custom Tables: ALL CLEAN ✅');
    } else {
      console.log('🗄️  Custom Tables: DATA REMAINING ❌');
      tablesWithData.forEach(table => console.log(`   - ${table}`));
    }

    // Orphaned Data
    if (results.orphanedData.length === 0) {
      console.log('🔍 Orphaned Data: NONE FOUND ✅');
    } else {
      console.log('🔍 Orphaned Data: FOUND ❌');
      results.orphanedData.forEach(data => 
        console.log(`   - ${data.email} (${data.full_name})`)
      );
    }

    // Overall Assessment
    const hasIssues = results.profile || 
                     Object.values(results.customTables).some(r => r.count > 0) ||
                     results.orphanedData.length > 0;

    console.log('\n🎯 OVERALL ASSESSMENT:');
    if (!hasIssues) {
      console.log('✅ USER DELETION COMPLETE - All data successfully removed');
    } else {
      console.log('❌ USER DELETION INCOMPLETE - Some data remains');
    }

    return results;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return null;
  }
}

// Usage example:
// Replace with actual user ID and email
const userId = '8513a774-4cbf-4b60-8e1c-3a3d01ba7bbc';
const originalEmail = 'salauddin.kader405@gmail.com';

// Run the full verification
verifyUserDeletion(userId, originalEmail);

// For now, let's run a basic check without specific user ID
async function runBasicCheck() {
  console.log('🔍 === BASIC DELETION VERIFICATION ===');
  console.log('Note: This is a basic check. For full verification, update the user ID in the script.');
  console.log('');
  
  try {
    // Check if we can connect to the database
    console.log('1️⃣ Testing database connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check for any disabled users
    console.log('\n2️⃣ Checking for disabled users...');
    const { data: disabledUsers, error: disabledError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .ilike('email', 'deleted_%');
    
    if (disabledError) {
      console.log('⚠️  Cannot check auth users (requires admin access)');
    } else if (disabledUsers && disabledUsers.length > 0) {
      console.log(`✅ Found ${disabledUsers.length} disabled user(s):`);
      disabledUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    } else {
      console.log('✅ No disabled users found');
    }
    
    console.log('\n📊 === BASIC CHECK COMPLETE ===');
    console.log('For full verification, update the user ID in the script and uncomment the verifyUserDeletion call.');
    
  } catch (error) {
    console.error('❌ Basic check failed:', error);
  }
}

// Run the basic check
runBasicCheck();

export { verifyUserDeletion }; 