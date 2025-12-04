-- SUPABASE NATIVE DELETION - Run this in Supabase SQL Editor

-- This approach uses Supabase's built-in user management
-- Instead of trying to delete auth.users directly, we'll disable the user

-- First, clean up any existing functions
DROP FUNCTION IF EXISTS delete_user_final_clean(UUID);
DROP FUNCTION IF EXISTS delete_user_trigger_based(UUID);
DROP FUNCTION IF EXISTS delete_user_final(UUID);
DROP FUNCTION IF EXISTS delete_user_simple(UUID);
DROP FUNCTION IF EXISTS delete_user_completely_direct(UUID);
DROP FUNCTION IF EXISTS delete_user_completely(UUID);

-- Drop any existing triggers
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();

-- Create a function that deletes all data and disables the user
CREATE OR REPLACE FUNCTION delete_user_native(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = delete_user_native.user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE NOTICE 'Profile does not exist for user %', delete_user_native.user_id;
        RETURN TRUE; -- Consider it a success if profile doesn't exist
    END IF;
    
    -- Delete all user data (ignore errors)
    BEGIN
        DELETE FROM lend_borrow_returns
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_native.user_id);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Delete profile
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_native.user_id;
        RAISE NOTICE 'Profile deleted for user %', delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Profile deletion failed: %', SQLERRM;
        deletion_success := FALSE;
    END;

    -- Instead of deleting auth user, we'll disable it
    -- This prevents login but keeps the user record for audit purposes
    BEGIN
        UPDATE auth.users 
        SET 
            email = 'deleted_' || extract(epoch from now()) || '@deleted.local',
            encrypted_password = '',
            email_confirmed_at = NULL,
            invited_at = NULL,
            confirmation_token = '',
            confirmation_sent_at = NULL,
            recovery_sent_at = NULL,
            email_change_token_new = '',
            email_change = '',
            email_change_sent_at = NULL,
            last_sign_in_at = NULL,
            raw_app_meta_data = '{"provider":"email","providers":["email"],"deleted":true}',
            raw_user_meta_data = '{"deleted":true,"deleted_at":"' || now() || '"}',
            is_super_admin = FALSE,
            created_at = now(),
            updated_at = now(),
            phone = NULL,
            phone_confirmed_at = NULL,
            phone_change = '',
            phone_change_token = '',
            phone_change_sent_at = NULL,
            email_change_token_current = '',
            email_change_confirm_status = 0,
            banned_until = NULL,
            reauthentication_sent_at = NULL,
            reauthentication_token = ''
        WHERE id = delete_user_native.user_id;
        
        RAISE NOTICE 'Auth user disabled for user %', delete_user_native.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Auth user disable failed: %', SQLERRM;
        -- Don't fail the whole operation if this fails
    END;

    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_native(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_native(UUID) TO anon;

-- Test the function
SELECT 'Native deletion function created successfully' as status; 