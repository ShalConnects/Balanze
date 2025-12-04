-- SUPABASE ADMIN DELETION - Run this in Supabase SQL Editor

-- This function uses Supabase's built-in admin functions
CREATE OR REPLACE FUNCTION delete_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := FALSE;
BEGIN
    -- Delete all user data first
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_admin.user_id);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Delete profile
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Try to use Supabase's built-in admin function
    BEGIN
        -- This should work if we have the right permissions
        PERFORM auth.users_delete(delete_user_admin.user_id);
        deletion_success := TRUE;
        RAISE NOTICE 'User deleted using admin function: %', delete_user_admin.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Admin function failed: %', SQLERRM;
        
        -- Fallback: try direct deletion
        BEGIN
            DELETE FROM auth.users WHERE id = delete_user_admin.user_id;
            deletion_success := TRUE;
            RAISE NOTICE 'User deleted using direct deletion: %', delete_user_admin.user_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Direct deletion also failed: %', SQLERRM;
            deletion_success := FALSE;
        END;
    END;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_admin(UUID) TO anon;

-- Test the function
SELECT 'Admin deletion function created successfully' as status; 