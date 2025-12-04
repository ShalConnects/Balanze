-- Fix Database Trigger for Email Uniqueness
-- This will actually prevent duplicate emails in Supabase

-- Step 1: Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_duplicate_email ON auth.users;

-- Step 2: Drop the existing function if it exists
DROP FUNCTION IF EXISTS prevent_duplicate_email_signup();

-- Step 3: Create a new, simpler function
CREATE OR REPLACE FUNCTION prevent_duplicate_email_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email already exists (case insensitive)
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE LOWER(email) = LOWER(NEW.email)
        AND id != NEW.id  -- Exclude the current user being updated
    ) THEN
        RAISE EXCEPTION 'User with this email address already exists. Please use a different email or try logging in.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
CREATE TRIGGER prevent_duplicate_email
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_email_signup();

-- Step 5: Test the trigger
-- This should show the trigger was created successfully
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'prevent_duplicate_email';

-- Step 6: Show current duplicate emails (for information)
SELECT 
    email, 
    COUNT(*) as user_count, 
    MIN(created_at) as oldest_user, 
    MAX(created_at) as newest_user
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. The trigger will now prevent new duplicate emails
-- 3. Test signup with existing email - should now show error
-- 4. If you want to clean up existing duplicates, run the cleanup function below

-- Optional: Clean up existing duplicates (run this separately if needed)
-- SELECT cleanup_duplicate_emails(); 