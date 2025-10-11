-- Check current savings_goals table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'savings_goals' 
ORDER BY ordinal_position;
