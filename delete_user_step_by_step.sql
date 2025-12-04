-- Step-by-step process to delete user a68ec4f5-72b0-4982-a2f1-eab24c98f316

-- Step 1: Disable the trigger that's preventing deletion
ALTER TABLE profiles DISABLE TRIGGER trigger_disable_auth_user_on_profile_delete;

-- Step 2: Delete the user from auth.users
DELETE FROM auth.users WHERE id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';

-- Step 3: Verify the user is deleted
SELECT id, email FROM auth.users WHERE id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';

-- Step 4: Re-enable the trigger (optional - only if you want to keep it)
-- ALTER TABLE profiles ENABLE TRIGGER trigger_disable_auth_user_on_profile_delete;

-- Alternative: If you want to completely remove the trigger function
-- DROP FUNCTION IF EXISTS disable_auth_user_on_profile_delete() CASCADE;
-- DROP TRIGGER IF EXISTS trigger_disable_auth_user_on_profile_delete ON profiles;

-- To check what triggers exist on the profiles table:
-- SELECT trigger_name, event_manipulation, action_statement 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'profiles'; 