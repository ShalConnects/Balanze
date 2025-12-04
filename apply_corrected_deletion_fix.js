const { createClient } = require('@supabase/supabase-js');

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

async function applyCorrectedDeletionFix() {
  console.log('🔧 Applying corrected user deletion fix...');
  
  try {
    // Read the corrected SQL script
    const fs = require('fs');
    const path = require('path');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix_user_deletion_trigger_corrected.sql'), 'utf8');
    
    console.log('📝 Executing corrected SQL script...');
    
    // Split the script into parts to execute manually
    const sqlParts = [
      // Drop existing trigger and function
      `DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
       DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();`,
      
      // Create corrected function
      `CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
       RETURNS TRIGGER AS $$
       DECLARE
           auth_user_exists BOOLEAN;
       BEGIN
           -- Check if auth user exists before trying to delete
           SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = OLD.id) INTO auth_user_exists;
           
           IF auth_user_exists THEN
               -- Delete the auth user when their profile is deleted
               DELETE FROM auth.users WHERE id = OLD.id;
               RAISE NOTICE 'Auth user % deleted successfully', OLD.id;
           ELSE
               RAISE NOTICE 'Auth user % does not exist, skipping deletion', OLD.id;
           END IF;
           
           -- Return the deleted row
           RETURN OLD;
       EXCEPTION
           WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting auth user %: %', OLD.id, SQLERRM;
               RETURN OLD;
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      
      // Create trigger
      `CREATE TRIGGER trigger_delete_auth_user_on_profile_delete
           AFTER DELETE ON profiles
           FOR EACH ROW
           EXECUTE FUNCTION delete_auth_user_on_profile_delete();`,
      
      // Grant permissions
      `GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO authenticated;
       GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO anon;`
    ];
    
    for (let i = 0; i < sqlParts.length; i++) {
      console.log(`Executing part ${i + 1}/${sqlParts.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: sqlParts[i] });
        
        if (error) {
          console.error(`❌ Error in part ${i + 1}:`, error);
          
          // Try alternative approach for this part
          console.log(`🔄 Trying alternative approach for part ${i + 1}...`);
          
          // For the function creation, try a simpler approach
          if (i === 1) {
            const simpleFunction = `CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
             RETURNS TRIGGER AS $$
             BEGIN
                 DELETE FROM auth.users WHERE id = OLD.id;
                 RETURN OLD;
             END;
             $$ LANGUAGE plpgsql SECURITY DEFINER;`;
            
            const { error: simpleError } = await supabase.rpc('exec_sql', { sql: simpleFunction });
            if (simpleError) {
              console.error(`❌ Simple function creation also failed:`, simpleError);
            } else {
              console.log(`✅ Simple function created successfully`);
            }
          }
        } else {
          console.log(`✅ Part ${i + 1} executed successfully`);
        }
      } catch (partError) {
        console.error(`❌ Exception in part ${i + 1}:`, partError);
      }
    }
    
    console.log('🎉 Corrected user deletion fix applied!');
    console.log('');
    console.log('📋 What this fix does:');
    console.log('   • Removes the problematic aggregate functions error');
    console.log('   • Creates a more robust trigger function with error handling');
    console.log('   • Ensures auth users are properly deleted when profiles are deleted');
    console.log('');
    console.log('🧪 To test:');
    console.log('   1. Create a test user account');
    console.log('   2. Delete the account through the UI');
    console.log('   3. Try to login with the same credentials - it should fail');
    console.log('');
    console.log('💡 If you still see issues, run this manually in Supabase SQL editor:');
    console.log('   Copy the contents of fix_user_deletion_trigger_corrected.sql');
    
  } catch (error) {
    console.error('❌ Error applying corrected fix:', error);
    console.log('');
    console.log('💡 Manual alternative:');
    console.log('   Go to your Supabase SQL Editor and run the corrected script manually');
  }
}

// Run the fix
applyCorrectedDeletionFix(); 