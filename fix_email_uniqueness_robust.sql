-- Robust Email Uniqueness Fix for Supabase
-- This approach works better with Supabase's auth system

-- Step 1: Create a function to check if email exists
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(email_to_check);
    
    RETURN user_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to prevent duplicate signups
CREATE OR REPLACE FUNCTION prevent_duplicate_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email already exists (case insensitive)
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE LOWER(email) = LOWER(NEW.email)
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    ) THEN
        RAISE EXCEPTION 'User with this email address already exists. Please use a different email or try logging in.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_duplicate_email ON auth.users;

-- Step 4: Create the trigger
CREATE TRIGGER prevent_duplicate_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_signup();

-- Step 5: Also create a trigger for updates (in case email is changed)
DROP TRIGGER IF EXISTS prevent_duplicate_email_update ON auth.users;

CREATE TRIGGER prevent_duplicate_email_update
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_signup();

-- Step 6: Test the function
SELECT check_email_exists('shalconnect00@gmail.com') as email_exists;

-- Step 7: Show current duplicate emails (for information)
SELECT 
    email, 
    COUNT(*) as user_count, 
    MIN(created_at) as oldest_user, 
    MAX(created_at) as newest_user
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 8: Verify triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%prevent_duplicate_email%';

-- Instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. The triggers will now prevent new duplicate emails
-- 3. Test signup with existing email - should now show error
-- 4. If you have existing duplicates, you may need to clean them up first 