-- Check actual schema of problematic tables
-- Run this in Supabase SQL Editor

-- Check savings_goals table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'savings_goals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check lend_borrow_returns table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lend_borrow_returns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 