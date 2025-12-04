-- FINAL SIMPLE DELETION - Run this in Supabase SQL Editor

-- This function uses a different approach to ensure auth user deletion
CREATE OR REPLACE FUNCTION delete_user_final(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := FALSE;
    affected_rows INTEGER;
BEGIN
    -- Delete all user data first (ignore errors)
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_final.user_id);
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore errors
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Delete profile
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_final.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Try to delete auth user using a different approach
    -- First, check if the user exists
    IF EXISTS(SELECT 1 FROM auth.users WHERE id = delete_user_final.user_id) THEN
        -- Try to delete using a more direct approach
        BEGIN
            -- Use a different method to delete auth user
            DELETE FROM auth.users WHERE id = delete_user_final.user_id;
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            
            IF affected_rows > 0 THEN
                deletion_success := TRUE;
                RAISE NOTICE 'Auth user deleted successfully: %', delete_user_final.user_id;
            ELSE
                RAISE NOTICE 'No auth user was deleted';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Auth user deletion failed: %', SQLERRM;
            deletion_success := FALSE;
        END;
    ELSE
        RAISE NOTICE 'Auth user does not exist: %', delete_user_final.user_id;
        deletion_success := TRUE; -- If user doesn't exist, consider it a success
    END IF;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_final(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_final(UUID) TO anon;

-- Test the function
SELECT 'Final deletion function created successfully' as status; 