-- Fix the trigger function that's causing the JSONB casting error
-- This function is trying to update auth.users when a profile is deleted

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS disable_auth_user_on_profile_delete() CASCADE;

-- Create the fixed function
CREATE OR REPLACE FUNCTION disable_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user to mark as deleted instead of actually deleting
    UPDATE auth.users 
    SET 
        email = 'deleted_' || extract(epoch from now()) || '@deleted.local',
        encrypted_password = '',
        email_confirmed_at = NULL,
        raw_app_meta_data = '{"provider":"email","providers":["email"],"deleted":true}'::jsonb,
        raw_user_meta_data = ('{"deleted":true,"deleted_at":"' || now() || '"}')::jsonb,
        updated_at = now()
    WHERE id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger if needed
-- DROP TRIGGER IF EXISTS trigger_disable_auth_user_on_profile_delete ON profiles;
-- CREATE TRIGGER trigger_disable_auth_user_on_profile_delete
--     AFTER DELETE ON profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION disable_auth_user_on_profile_delete();

-- Alternative: If you want to completely remove this trigger function
-- DROP FUNCTION IF EXISTS disable_auth_user_on_profile_delete() CASCADE;
-- DROP TRIGGER IF EXISTS trigger_disable_auth_user_on_profile_delete ON profiles;

-- To check if the trigger exists:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_disable_auth_user_on_profile_delete';

-- To disable the trigger temporarily:
-- ALTER TABLE profiles DISABLE TRIGGER trigger_disable_auth_user_on_profile_delete;

-- To enable the trigger:
-- ALTER TABLE profiles ENABLE TRIGGER trigger_disable_auth_user_on_profile_delete; 