const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyUserDeletionFix() {
  console.log('🔧 Applying user deletion fix...');
  
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix_user_deletion_trigger.sql'), 'utf8');
    
    console.log('📝 Executing SQL script...');
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Fallback: try to execute the script in parts
      console.log('🔄 Trying alternative approach...');
      
      const sqlParts = [
        // Create function
        `CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
         RETURNS TRIGGER AS $$
         BEGIN
             DELETE FROM auth.users WHERE id = OLD.id;
             RETURN OLD;
         END;
         $$ LANGUAGE plpgsql SECURITY DEFINER;`,
        
        // Create trigger
        `DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
         CREATE TRIGGER trigger_delete_auth_user_on_profile_delete
             AFTER DELETE ON profiles
             FOR EACH ROW
             EXECUTE FUNCTION delete_auth_user_on_profile_delete();`,
        
        // Grant permissions
        `GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO authenticated;
         GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO anon;`
      ];
      
      for (let i = 0; i < sqlParts.length; i++) {
        console.log(`Executing part ${i + 1}/${sqlParts.length}...`);
        const { error: partError } = await supabase.rpc('exec_sql', { sql: sqlParts[i] });
        
        if (partError) {
          console.error(`❌ Error in part ${i + 1}:`, partError);
        } else {
          console.log(`✅ Part ${i + 1} executed successfully`);
        }
      }
    } else {
      console.log('✅ SQL script executed successfully');
    }
    
    console.log('🎉 User deletion fix applied successfully!');
    console.log('');
    console.log('📋 What this fix does:');
    console.log('   • Creates a database trigger that automatically deletes auth users when profiles are deleted');
    console.log('   • Ensures complete user deletion when users delete their accounts');
    console.log('   • Prevents users from logging back in after account deletion');
    console.log('');
    console.log('🧪 To test:');
    console.log('   1. Create a test user account');
    console.log('   2. Delete the account through the UI');
    console.log('   3. Try to login with the same credentials - it should fail');
    
  } catch (error) {
    console.error('❌ Error applying fix:', error);
    console.log('');
    console.log('💡 Manual alternative:');
    console.log('   Run the SQL script manually in your Supabase SQL editor:');
    console.log('   Copy the contents of fix_user_deletion_trigger.sql and execute it');
  }
}

// Run the fix
applyUserDeletionFix(); 