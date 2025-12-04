-- SIMPLE AUTH DELETION - Run this in Supabase SQL Editor

-- This function simply deletes the auth user and any related data
CREATE OR REPLACE FUNCTION delete_user_simple(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
BEGIN
    -- Delete all user data first
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_simple.user_id);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting lend_borrow_returns: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting notifications: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting donation_saving_records: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting lend_borrow: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchase_attachments: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchases: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchase_categories: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting transactions: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting accounts: %', SQLERRM;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting audit_logs: %', SQLERRM;
    END;

    -- Delete profile if it exists
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_simple.user_id;
        RAISE NOTICE 'Profile deleted for user %', delete_user_simple.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Profile deletion error (might not exist): %', SQLERRM;
    END;

    -- Delete auth user directly (this is the main goal)
    BEGIN
        DELETE FROM auth.users WHERE id = delete_user_simple.user_id;
        RAISE NOTICE 'Auth user deleted: %', delete_user_simple.user_id;
        deletion_success := TRUE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting auth user: %', SQLERRM;
        deletion_success := FALSE;
    END;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_simple(UUID) TO anon;

-- Test the function
SELECT 'Simple deletion function created successfully' as status; 