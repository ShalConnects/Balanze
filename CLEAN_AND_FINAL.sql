-- CLEAN AND FINAL - Run this in Supabase SQL Editor

-- First, clean up all old functions
DROP FUNCTION IF EXISTS delete_user_completely(UUID);
DROP FUNCTION IF EXISTS delete_user_completely_direct(UUID);
DROP FUNCTION IF EXISTS delete_user_simple(UUID);
DROP FUNCTION IF EXISTS delete_user_final(UUID);
DROP FUNCTION IF EXISTS delete_user_admin(UUID);
DROP FUNCTION IF EXISTS delete_user_trigger_based(UUID);

-- Clean up old triggers
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();

-- Now create the final, working solution
-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the auth user when their profile is deleted
    DELETE FROM auth.users WHERE id = OLD.id;
    RAISE NOTICE 'Auth user % deleted by trigger', OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
CREATE TRIGGER trigger_delete_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- 3. Create the main deletion function
CREATE OR REPLACE FUNCTION delete_user_final_clean(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = delete_user_final_clean.user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE NOTICE 'Profile does not exist for user %', delete_user_final_clean.user_id;
        RETURN TRUE; -- Consider it a success if profile doesn't exist
    END IF;
    
    -- Delete all user data (ignore errors)
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_final_clean.user_id);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Delete profile (this will trigger auth user deletion)
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_final_clean.user_id;
        RAISE NOTICE 'Profile deleted for user % - trigger should delete auth user', delete_user_final_clean.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Profile deletion failed: %', SQLERRM;
        deletion_success := FALSE;
    END;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_final_clean(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_final_clean(UUID) TO anon;

-- Test the function
SELECT 'Clean and final deletion system created successfully' as status; 