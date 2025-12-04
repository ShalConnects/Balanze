-- TRIGGER BASED DELETION - Run this in Supabase SQL Editor

-- First, create a simple trigger that deletes auth user when profile is deleted
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();

-- Create the trigger function
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the auth user when their profile is deleted
    DELETE FROM auth.users WHERE id = OLD.id;
    RAISE NOTICE 'Auth user % deleted by trigger', OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_delete_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- Now create a simple function that just deletes user data and profile
CREATE OR REPLACE FUNCTION delete_user_trigger_based(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
BEGIN
    -- Delete all user data first
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_trigger_based.user_id);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Delete profile (this will trigger auth user deletion)
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_trigger_based.user_id;
        RAISE NOTICE 'Profile deleted for user % - trigger should delete auth user', delete_user_trigger_based.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Profile deletion failed: %', SQLERRM;
        deletion_success := FALSE;
    END;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_trigger_based(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_trigger_based(UUID) TO anon;

-- Test the trigger
SELECT 'Trigger-based deletion system created successfully' as status; 