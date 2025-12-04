-- Check the create_default_cash_account function
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_default_cash_account'
AND routine_schema = 'public';

-- Check if accounts table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any errors in the function
SELECT 'Function exists:' as info;
SELECT EXISTS(
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'create_default_cash_account'
    AND routine_schema = 'public'
) as function_exists; 