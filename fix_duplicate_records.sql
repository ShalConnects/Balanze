-- Fix duplicate records in last_wish_settings table
-- This script will keep only the most recent record for each user

-- First, let's see how many duplicate records we have
SELECT 
    user_id, 
    COUNT(*) as record_count,
    MAX(updated_at) as latest_update,
    MIN(updated_at) as earliest_update
FROM last_wish_settings 
GROUP BY user_id 
HAVING COUNT(*) > 1
ORDER BY record_count DESC;

-- Create a temporary table with the latest record for each user
CREATE TEMP TABLE latest_last_wish_settings AS
SELECT DISTINCT ON (user_id) *
FROM last_wish_settings
ORDER BY user_id, updated_at DESC;

-- Show what we're about to keep
SELECT 
    user_id,
    is_enabled,
    is_active,
    updated_at,
    created_at
FROM latest_last_wish_settings
ORDER BY user_id;

-- Delete all records from the original table
DELETE FROM last_wish_settings;

-- Insert back only the latest record for each user
INSERT INTO last_wish_settings 
SELECT * FROM latest_last_wish_settings;

-- Verify the fix
SELECT 
    user_id, 
    COUNT(*) as record_count
FROM last_wish_settings 
GROUP BY user_id 
ORDER BY user_id;

-- Clean up temporary table
DROP TABLE latest_last_wish_settings;

-- Final verification - should show only 1 record per user
SELECT 
    'Total users with Last Wish settings: ' || COUNT(DISTINCT user_id) as summary
FROM last_wish_settings;
