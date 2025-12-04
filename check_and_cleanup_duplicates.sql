-- Check and Cleanup Duplicate Emails
-- Run this BEFORE applying the comprehensive fix

-- Step 1: Check for existing duplicate emails
SELECT '=== CHECKING FOR DUPLICATE EMAILS ===' as info;

SELECT 
    email, 
    COUNT(*) as user_count,
    array_agg(id ORDER BY created_at) as user_ids,
    array_agg(created_at ORDER BY created_at) as created_dates,
    array_agg(email_confirmed_at ORDER BY created_at) as confirmation_dates
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 2: Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_duplicate_emails_safe()
RETURNS TABLE (
    email_address TEXT,
    kept_user_id UUID,
    deleted_count INTEGER,
    message TEXT
) AS $$
DECLARE
    duplicate_record RECORD;
    user_to_keep UUID;
    users_to_delete UUID[];
    deleted_count INTEGER;
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
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN QUERY SELECT 
            duplicate_record.email,
            user_to_keep,
            deleted_count,
            'Kept oldest user, deleted ' || deleted_count || ' duplicates';
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Show what would be cleaned up (without actually doing it)
SELECT '=== PREVIEW OF CLEANUP ===' as info;

-- This shows what would happen without actually doing it
WITH duplicate_emails AS (
    SELECT 
        email, 
        COUNT(*) as user_count,
        array_agg(id ORDER BY created_at) as user_ids,
        array_agg(created_at ORDER BY created_at) as created_dates
    FROM auth.users 
    GROUP BY email 
    HAVING COUNT(*) > 1
)
SELECT 
    email,
    user_count,
    user_ids[1] as user_to_keep,
    user_ids[2:array_length(user_ids, 1)] as users_to_delete,
    created_dates[1] as keep_user_created,
    created_dates[2:array_length(created_dates, 1)] as delete_users_created
FROM duplicate_emails
ORDER BY user_count DESC;

-- Step 4: Instructions for cleanup
SELECT '=== CLEANUP INSTRUCTIONS ===' as info;

-- To actually clean up duplicates, uncomment and run:
-- SELECT * FROM cleanup_duplicate_emails_safe();

-- Step 5: Verify no duplicates remain
SELECT '=== VERIFICATION QUERY ===' as info;
-- After cleanup, run this to verify:
-- SELECT email, COUNT(*) as user_count FROM auth.users GROUP BY email HAVING COUNT(*) > 1;

-- Instructions:
-- 1. First run this script to see what duplicates exist
-- 2. Review the preview carefully
-- 3. If you want to clean up, uncomment the SELECT * FROM cleanup_duplicate_emails_safe(); line
-- 4. Run the verification query to confirm cleanup worked
-- 5. Then run the comprehensive_auth_fix.sql script 