-- Check trigger status
-- This will show us exactly what's wrong

-- 1. Check if the trigger exists
SELECT 
    'TRIGGER STATUS:' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_log_transaction_changes';

-- 2. Check if the function exists
SELECT 
    'FUNCTION STATUS:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'log_transaction_changes';

-- 3. Check table permissions
SELECT 
    'TABLE PERMISSIONS:' as info,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'transaction_history';

-- 4. Check RLS status
SELECT 
    'RLS STATUS:' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'transaction_history';

-- 5. Manual test - let's try to insert a record manually
INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
VALUES ('TEST123', 'description', 'old', 'new')
ON CONFLICT DO NOTHING;

SELECT 
    'MANUAL INSERT TEST:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM transaction_history WHERE transaction_id = 'TEST123') 
        THEN 'SUCCESS - Can insert manually'
        ELSE 'FAILED - Cannot insert manually'
    END as result;

-- 6. Clean up test record
DELETE FROM transaction_history WHERE transaction_id = 'TEST123'; 