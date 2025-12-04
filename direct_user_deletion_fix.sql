-- =====================================================
-- DIRECT USER DELETION FIX
-- =====================================================
-- This approach uses a direct function call instead of triggers
-- to ensure complete user deletion

-- Step 1: Drop any existing trigger and function
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();

-- Step 2: Create a function that deletes user completely
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
BEGIN
    -- Delete all user data in the correct order
    BEGIN
        -- Delete notifications
        DELETE FROM public.notifications WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted notifications for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting notifications: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete donation saving records
        DELETE FROM public.donation_saving_records WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted donation saving records for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting donation saving records: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete lend/borrow returns
        DELETE FROM public.lend_borrow_returns WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted lend/borrow returns for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting lend/borrow returns: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete lend/borrow records
        DELETE FROM public.lend_borrow WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted lend/borrow records for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting lend/borrow records: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete purchase attachments
        DELETE FROM public.purchase_attachments WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted purchase attachments for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchase attachments: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete purchases
        DELETE FROM public.purchases WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted purchases for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchases: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete purchase categories
        DELETE FROM public.purchase_categories WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted purchase categories for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchase categories: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete transactions
        DELETE FROM public.transactions WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted transactions for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting transactions: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete accounts
        DELETE FROM public.accounts WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted accounts for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting accounts: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete savings goals (try both column names)
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
        -- Delete audit logs
        DELETE FROM public.audit_logs WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted audit logs for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting audit logs: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Delete profile
        DELETE FROM public.profiles WHERE id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted profile for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting profile: %', SQLERRM;
        deletion_success := FALSE;
    END;

    BEGIN
        -- Finally, delete auth user
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

-- Step 4: Test the function (optional)
-- SELECT delete_user_completely('your-test-user-id-here');

-- Step 5: Create a simple trigger as backup (simpler version)
CREATE OR REPLACE FUNCTION simple_delete_auth_user()
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
GRANT EXECUTE ON FUNCTION simple_delete_auth_user() TO anon; 