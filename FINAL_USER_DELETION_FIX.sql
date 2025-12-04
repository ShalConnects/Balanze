-- =====================================================
-- FINAL USER DELETION FIX - CORRECTED COLUMN NAMES
-- =====================================================
-- Run this SQL directly in your Supabase SQL Editor
-- This will fix the account deletion issues you encountered

-- Step 1: Drop ALL existing triggers and functions
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP TRIGGER IF EXISTS simple_trigger_delete_auth_user ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();
DROP FUNCTION IF EXISTS simple_delete_auth_user();

-- Step 2: Create a corrected function that deletes user completely
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO anon;

-- Step 4: Create simple backup trigger (only if it doesn't exist)
CREATE OR REPLACE FUNCTION simple_delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
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
GRANT EXECUTE ON FUNCTION simple_delete_auth_user() TO anon;

-- Step 5: Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'delete_user_completely';

-- Step 6: Test the function (optional - uncomment to test with a specific user ID)
-- SELECT delete_user_completely('your-test-user-id-here'); 