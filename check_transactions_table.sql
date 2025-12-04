-- Check the structure of the transactions table
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
