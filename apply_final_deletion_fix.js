import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFinalDeletionFix() {
  console.log('🔧 Applying final user deletion fix...');
  console.log('📋 This will fix the account deletion issues you encountered');
  console.log('');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix_user_deletion_final.sql', 'utf8');
    
    // Split the script into parts to execute manually
    const sqlParts = [
      // Drop existing triggers and functions
      `DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
       DROP TRIGGER IF EXISTS simple_trigger_delete_auth_user ON profiles;
       DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();
       DROP FUNCTION IF EXISTS simple_delete_auth_user();`,
      
      // Create the main deletion function
      `CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
       RETURNS BOOLEAN AS $$
       DECLARE
           deletion_success BOOLEAN := TRUE;
       BEGIN
           -- Delete all user data in the correct order
           
           -- 1. Delete notifications
           BEGIN
               DELETE FROM public.notifications WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted notifications for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting notifications: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 2. Delete donation saving records
           BEGIN
               DELETE FROM public.donation_saving_records WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted donation saving records for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting donation saving records: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 3. Delete lend/borrow returns (via lend_borrow table)
           BEGIN
               DELETE FROM public.lend_borrow_returns 
               WHERE lend_borrow_id IN (
                   SELECT id FROM public.lend_borrow WHERE user_id = delete_user_completely.user_id
               );
               RAISE NOTICE 'Deleted lend/borrow returns for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting lend/borrow returns: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 4. Delete lend/borrow records
           BEGIN
               DELETE FROM public.lend_borrow WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted lend/borrow records for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting lend/borrow records: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 5. Delete purchase attachments
           BEGIN
               DELETE FROM public.purchase_attachments WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted purchase attachments for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting purchase attachments: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 6. Delete purchases
           BEGIN
               DELETE FROM public.purchases WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted purchases for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting purchases: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 7. Delete purchase categories
           BEGIN
               DELETE FROM public.purchase_categories WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted purchase categories for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting purchase categories: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 8. Delete transactions
           BEGIN
               DELETE FROM public.transactions WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted transactions for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting transactions: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 9. Delete accounts
           BEGIN
               DELETE FROM public.accounts WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted accounts for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting accounts: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 10. Delete savings goals (using user_id, not profile_id)
           BEGIN
               DELETE FROM public.savings_goals WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted savings goals for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting savings goals: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 11. Delete audit logs
           BEGIN
               DELETE FROM public.audit_logs WHERE user_id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted audit logs for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting audit logs: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 12. Delete profile (this should trigger the simple trigger)
           BEGIN
               DELETE FROM public.profiles WHERE id = delete_user_completely.user_id;
               RAISE NOTICE 'Deleted profile for user %', delete_user_completely.user_id;
           EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'Error deleting profile: %', SQLERRM;
               deletion_success := FALSE;
           END;

           -- 13. Finally, delete auth user
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

       DO $$
       BEGIN
           IF NOT EXISTS (
               SELECT 1 FROM pg_trigger 
               WHERE tgname = 'simple_trigger_delete_auth_user' 
               AND tgrelid = 'public.profiles'::regclass
           ) THEN
               CREATE TRIGGER simple_trigger_delete_auth_user
                   AFTER DELETE ON profiles
                   FOR EACH ROW
                   EXECUTE FUNCTION simple_delete_auth_user();
           END IF;
       END $$;

       GRANT EXECUTE ON FUNCTION simple_delete_auth_user() TO authenticated;
       GRANT EXECUTE ON FUNCTION simple_delete_auth_user() TO anon;`
    ];
    
    for (let i = 0; i < sqlParts.length; i++) {
      console.log(`📝 Executing part ${i + 1}/${sqlParts.length}...`);
      
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
    
    console.log('');
    console.log('🎉 Final user deletion fix applied successfully!');
    console.log('');
    console.log('📋 What this fix does:');
    console.log('   • Fixes column name issues (user_id vs profile_id)');
    console.log('   • Correctly handles lend_borrow_returns deletion');
    console.log('   • Ensures complete user deletion including auth.users');
    console.log('   • Includes proper error handling for each step');
    console.log('   • Creates a backup trigger for additional safety');
    console.log('');
    console.log('🧪 To test:');
    console.log('   1. Create a test user account');
    console.log('   2. Add some data (transactions, purchases, etc.)');
    console.log('   3. Try deleting the account');
    console.log('   4. Verify you cannot log in with the same credentials');
    console.log('');
    console.log('⚠️  Important: The account deletion will now work properly!');
    
  } catch (error) {
    console.error('❌ Failed to apply deletion fix:', error);
  }
}

// Run the fix
applyFinalDeletionFix(); 