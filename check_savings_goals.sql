-- Check savings_goals table structure
-- Run this in Supabase SQL Editor

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'savings_goals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'savings_goals' 
    AND table_schema = 'public'
) as table_exists; 