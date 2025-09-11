-- Cleanup Duplicate Emails in Supabase
-- Run this BEFORE applying the uniqueness constraints

-- Step 1: Show all duplicate emails
SELECT 
    email, 
    COUNT(*) as user_count,
    array_agg(id) as user_ids,
    array_agg(created_at) as created_dates
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 2: Create a function to clean up duplicates
CREATE OR REPLACE FUNCTION cleanup_duplicate_emails()
RETURNS TEXT AS $$
DECLARE
    duplicate_record RECORD;
    user_to_keep UUID;
    users_to_delete UUID[];
    cleanup_count INTEGER := 0;
BEGIN
    -- Loop through all duplicate emails
    FOR duplicate_record IN 
        SELECT 
            email, 
            COUNT(*) as user_count,
            array_agg(id ORDER BY created_at) as user_ids,
            array_agg(created_at ORDER BY created_at) as created_dates
        FROM auth.users 
        GROUP BY email 
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the oldest user (first in the array)
        user_to_keep := duplicate_record.user_ids[1];
        -- Get all other users to delete
        users_to_delete := duplicate_record.user_ids[2:array_length(duplicate_record.user_ids, 1)];
        
        -- Delete the duplicate users
        DELETE FROM auth.users 
        WHERE id = ANY(users_to_delete);
        
        cleanup_count := cleanup_count + array_length(users_to_delete, 1);
        
        RAISE NOTICE 'Cleaned up % duplicate users for email: % (kept user: %)', 
            array_length(users_to_delete, 1), 
            duplicate_record.email, 
            user_to_keep;
    END LOOP;
    
    RETURN 'Cleaned up ' || cleanup_count || ' duplicate users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Run the cleanup (uncomment the line below to actually clean up)
-- SELECT cleanup_duplicate_emails();

-- Step 4: Verify cleanup (run this after cleanup)
SELECT 
    email, 
    COUNT(*) as user_count
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Instructions:
-- 1. First run this script to see what duplicates exist
-- 2. Review the results carefully
-- 3. If you want to clean up, uncomment the SELECT cleanup_duplicate_emails(); line
-- 4. Run the verification query to confirm cleanup worked
-- 5. Then run the fix_email_uniqueness_robust.sql script 