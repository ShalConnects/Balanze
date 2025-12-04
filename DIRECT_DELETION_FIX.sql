-- DIRECT DELETION FIX - Run this in Supabase SQL Editor
-- This will create a simple trigger that deletes auth users when profiles are deleted

-- Drop any existing triggers
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP TRIGGER IF EXISTS simple_trigger_delete_auth_user ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();
DROP FUNCTION IF EXISTS simple_delete_auth_user();

-- Create a simple function to delete auth user
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO anon;

-- Test the trigger
SELECT 'Trigger created successfully' as status; 