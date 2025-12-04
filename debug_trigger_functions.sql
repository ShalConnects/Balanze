-- Debug script to check current trigger function definitions
-- This will help us understand why we're still getting VARCHAR(8) errors

-- Check if the functions exist and their definitions
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('create_lend_borrow_transaction', 'settle_lend_borrow_loan', 'handle_partial_return');

-- Check the current column definitions
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
AND column_name IN ('transaction_id', 'repayment_transaction_id', 'interest_transaction_id');

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'lend_borrow';
