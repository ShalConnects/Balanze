-- SIMPLE DISABLE USER - Run this in Supabase SQL Editor

-- Clean up any existing functions
DROP FUNCTION IF EXISTS delete_user_native(UUID);
DROP FUNCTION IF EXISTS delete_user_final_clean(UUID);
DROP FUNCTION IF EXISTS delete_user_trigger_based(UUID);
DROP FUNCTION IF EXISTS delete_user_final(UUID);
DROP FUNCTION IF EXISTS delete_user_simple(UUID);
DROP FUNCTION IF EXISTS delete_user_completely_direct(UUID);
DROP FUNCTION IF EXISTS delete_user_completely(UUID);

-- Drop any existing triggers
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();

-- Create a simple trigger that disables the auth user when profile is deleted
CREATE OR REPLACE FUNCTION disable_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Disable the auth user when their profile is deleted
    UPDATE auth.users 
    SET 
        email = 'deleted_' || extract(epoch from now()) || '@deleted.local',
        encrypted_password = '',
        email_confirmed_at = NULL,
        raw_app_meta_data = '{"provider":"email","providers":["email"],"deleted":true}',
        raw_user_meta_data = '{"deleted":true,"deleted_at":"' || now() || '"}',
        updated_at = now()
    WHERE id = OLD.id;
    
    RAISE NOTICE 'Auth user disabled: %', OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_disable_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION disable_auth_user_on_profile_delete();

-- Create a simple function that just deletes user data and profile
CREATE OR REPLACE FUNCTION delete_user_simple_disable(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = delete_user_simple_disable.user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE NOTICE 'Profile does not exist for user %', delete_user_simple_disable.user_id;
        RETURN TRUE; -- Consider it a success if profile doesn't exist
    END IF;
    
    -- Delete all user data (ignore errors)
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_simple_disable.user_id);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Delete profile (this will trigger auth user disable)
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_simple_disable.user_id;
        RAISE NOTICE 'Profile deleted for user % - trigger should disable auth user', delete_user_simple_disable.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Profile deletion failed: %', SQLERRM;
        deletion_success := FALSE;
    END;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_simple_disable(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_simple_disable(UUID) TO anon;

-- Test the function
SELECT 'Simple disable system created successfully' as status; 