-- =====================================================
-- CORRECTED USER DELETION TRIGGER
-- =====================================================
-- This script creates a trigger that automatically deletes the auth user
-- when their profile is deleted, ensuring complete user deletion.

-- Step 1: Drop any existing trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
DROP FUNCTION IF EXISTS delete_auth_user_on_profile_delete();

-- Step 2: Create a corrected function that will handle the auth user deletion
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
DECLARE
    auth_user_exists BOOLEAN;
BEGIN
    -- Check if auth user exists before trying to delete
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = OLD.id) INTO auth_user_exists;
    
    IF auth_user_exists THEN
        -- Delete the auth user when their profile is deleted
        DELETE FROM auth.users WHERE id = OLD.id;
        RAISE NOTICE 'Auth user % deleted successfully', OLD.id;
    ELSE
        RAISE NOTICE 'Auth user % does not exist, skipping deletion', OLD.id;
    END IF;
    
    -- Return the deleted row
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting auth user %: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger on the profiles table
CREATE TRIGGER trigger_delete_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- Step 4: Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO anon;

-- Step 5: Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_delete_auth_user_on_profile_delete';

-- =====================================================
-- ALTERNATIVE: Manual cleanup for existing orphaned users
-- =====================================================
-- If you want to clean up any existing users that were "deleted" but still exist in auth.users:

-- Find orphaned auth users (users in auth.users but not in profiles)
-- SELECT au.id, au.email, au.created_at
-- FROM auth.users au 
-- LEFT JOIN profiles p ON au.id = p.id 
-- WHERE p.id IS NULL
-- ORDER BY au.created_at DESC;

-- Delete orphaned auth users (uncomment and modify as needed)
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id 
--     FROM auth.users au 
--     LEFT JOIN profiles p ON au.id = p.id 
--     WHERE p.id IS NULL
-- ); 