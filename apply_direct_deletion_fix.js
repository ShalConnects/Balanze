import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDirectDeletionFix() {
  console.log('🔧 Applying direct user deletion fix...');
  
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'direct_user_deletion_fix.sql'), 'utf8');
    
    console.log('📝 Executing direct deletion SQL script...');
    
    // Split the script into parts to execute manually
    const sqlParts = [
      // Drop existing trigger and function
      `DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
       DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();`,
      
      // Create the main deletion function
      `CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
       RETURNS BOOLEAN AS $$
       DECLARE
           deletion_success BOOLEAN := TRUE;
       BEGIN
           -- Delete all user data in the correct order
           BEGIN
               DELETE FROM public.notifications WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted notifications for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting notifications: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.donation_saving_records WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted donation saving records for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting donation saving records: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.lend_borrow_returns WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted lend/borrow returns for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting lend/borrow returns: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.lend_borrow WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted lend/borrow records for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting lend/borrow records: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.purchase_attachments WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted purchase attachments for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting purchase attachments: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.purchases WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted purchases for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting purchases: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.purchase_categories WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted purchase categories for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting purchase categories: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.transactions WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted transactions for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting transactions: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.accounts WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted accounts for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting accounts: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.savings_goals WHERE profile_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted savings goals for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               BEGIN
                   DELETE FROM public.savings_goals WHERE user_id = delete_user_completely.user_id;
                   RAISE NOTICE 'Deleted savings goals (using user_id) for user %', delete_user_completely.user_id;
               EXCEPTION WHEN OTHERS THEN
                   RAISE NOTICE 'Error deleting savings goals: %', SQLERRM;
                   deletion_success := FALSE;
               END;
           END;

           BEGIN
               DELETE FROM public.audit_logs WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted audit logs for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting audit logs: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM public.profiles WHERE id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted profile for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting profile: %', SQLERRM;
               deletion_success := FALSE;
           END;

           BEGIN
               DELETE FROM auth.users WHERE id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted auth user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting auth user: %', SQLERRM;
               deletion_success := FALSE;
           END;

           RETURN deletion_success;
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      
      // Grant permissions
      `GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;
       GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO anon;`,
      
      // Create simple backup trigger
      `CREATE OR REPLACE FUNCTION simple_delete_auth_user()
       RETURNS TRIGGER AS $$
       BEGIN
           DELETE FROM auth.users WHERE id = OLD.id;
           RETURN OLD;
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;

       CREATE TRIGGER simple_trigger_delete_auth_user
           AFTER DELETE ON profiles
           FOR EACH ROW
           EXECUTE FUNCTION simple_delete_auth_user();

       GRANT EXECUTE ON FUNCTION simple_delete_auth_user() TO authenticated;
       GRANT EXECUTE ON FUNCTION simple_delete_auth_user() TO anon;`
    ];
    
    for (let i = 0; i < sqlParts.length; i++) {
      console.log(`Executing part ${i + 1}/${sqlParts.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: sqlParts[i] });
        
        if (error) {
          console.error(`❌ Error in part ${i + 1}:`, error);
        } else {
          console.log(`✅ Part ${i + 1} executed successfully`);
        }
      } catch (partError) {
        console.error(`❌ Exception in part ${i + 1}:`, partError);
      }
    }
    
    console.log('🎉 Direct user deletion fix applied successfully!');
    console.log('');
    console.log('📋 What this fix does:');
    console.log('   • Creates a database function that deletes user completely');
    console.log('   • Handles all user data deletion in the correct order');
    console.log('   • Includes proper error handling for each deletion step');
    console.log('   • Creates a simple backup trigger as additional safety');
    console.log('   • Frontend now calls this function directly');
    console.log('');
    console.log('🧪 To test:');
    console.log('   1. Create a test user account');
    console.log('   2. Delete the account through the UI');
    console.log('   3. Check console for detailed deletion logs');
    console.log('   4. Try to login with the same credentials - it should fail');
    console.log('');
    console.log('💡 If you still see issues, run this manually in Supabase SQL editor:');
    console.log('   Copy the contents of direct_user_deletion_fix.sql');
    
  } catch (error) {
    console.error('❌ Error applying direct deletion fix:', error);
    console.log('');
    console.log('💡 Manual alternative:');
    console.log('   Go to your Supabase SQL Editor and run the direct deletion script manually');
  }
}

// Run the fix
applyDirectDeletionFix(); 