-- Fix Email Uniqueness in Supabase Auth
-- This script enforces unique email addresses in your Supabase project

-- Step 1: Create a function to check if email already exists
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count users with this email
    SELECT COUNT(*) INTO user_count 
    FROM auth.users 
    WHERE email = email_to_check;
    
    RETURN user_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to prevent duplicate email signups
CREATE OR REPLACE FUNCTION prevent_duplicate_email_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email already exists
    IF check_email_exists(NEW.email) THEN
        RAISE EXCEPTION 'User with this email address already exists. Please use a different email or try logging in.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to prevent duplicate emails
DROP TRIGGER IF EXISTS prevent_duplicate_email ON auth.users;
CREATE TRIGGER prevent_duplicate_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_email_signup();

-- Step 4: Add a unique constraint on email (if possible)
-- Note: This might fail if there are already duplicate emails
-- ALTER TABLE auth.users ADD CONSTRAINT unique_email UNIQUE (email);

-- Step 5: Create a function to clean up duplicate emails (optional)
CREATE OR REPLACE FUNCTION cleanup_duplicate_emails()
RETURNS void AS $$
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Find and delete duplicate users, keeping the oldest one
    FOR duplicate_record IN 
        SELECT email, COUNT(*) as count, MIN(created_at) as oldest_created
        FROM auth.users 
        GROUP BY email 
        HAVING COUNT(*) > 1
    LOOP
        -- Delete all but the oldest user with this email
        DELETE FROM auth.users 
        WHERE email = duplicate_record.email 
        AND created_at > duplicate_record.oldest_created;
        
        RAISE NOTICE 'Cleaned up duplicate email: %', duplicate_record.email;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Show current duplicate emails (for information)
SELECT email, COUNT(*) as user_count, MIN(created_at) as oldest_user, MAX(created_at) as newest_user
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. The trigger will prevent new duplicate emails
-- 3. Optionally run: SELECT cleanup_duplicate_emails(); to clean existing duplicates
-- 4. Test signup with existing email - should now show error 