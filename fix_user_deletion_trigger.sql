-- =====================================================
-- FIX USER DELETION ISSUE
-- =====================================================
-- This script creates a trigger that automatically deletes the auth user
-- when their profile is deleted, ensuring complete user deletion.

-- Step 1: Create a function that will handle the auth user deletion
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the auth user when their profile is deleted
    DELETE FROM auth.users WHERE id = OLD.id;
    
    -- Return the deleted row
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on the profiles table
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_delete ON profiles;
CREATE TRIGGER trigger_delete_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- Step 3: Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO anon;

-- Step 4: Test the trigger (optional - uncomment to test)
-- INSERT INTO profiles (id, email, full_name) VALUES ('test-user-id', 'test@example.com', 'Test User');
-- DELETE FROM profiles WHERE id = 'test-user-id';

-- =====================================================
-- ALTERNATIVE: Manual cleanup for existing users
-- =====================================================
-- If you want to clean up any existing users that were "deleted" but still exist in auth.users:

-- Find orphaned auth users (users in auth.users but not in profiles)
-- SELECT au.id, au.email 
-- FROM auth.users au 
-- LEFT JOIN profiles p ON au.id = p.id 
-- WHERE p.id IS NULL;

-- Delete orphaned auth users (uncomment and modify as needed)
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id 
--     FROM auth.users au 
--     LEFT JOIN profiles p ON au.id = p.id 
--     WHERE p.id IS NULL
-- ); 