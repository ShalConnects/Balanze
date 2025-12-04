-- Simple Email Uniqueness Fix for Supabase
-- Since triggers might not work on auth.users, let's try a unique constraint

-- Step 1: Check if we can add a unique constraint
-- This might fail if there are already duplicate emails
SELECT 
    email, 
    COUNT(*) as user_count
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 2: If no duplicates exist, add unique constraint
-- Uncomment the line below if the query above shows no duplicates
-- ALTER TABLE auth.users ADD CONSTRAINT unique_email UNIQUE (email);

-- Step 3: Alternative approach - Create a function to check email existence
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

-- Step 4: Test the function
SELECT check_email_exists('shalconnect00@gmail.com') as email_exists;

-- Instructions:
-- 1. Run this script in Supabase SQL Editor
-- 2. If there are no duplicate emails, uncomment the ALTER TABLE line
-- 3. If there are duplicates, we need to clean them up first
-- 4. The function can be used to check email existence programmatically 