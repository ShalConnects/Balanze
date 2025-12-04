-- Check the actual schema of savings_goals table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'savings_goals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
