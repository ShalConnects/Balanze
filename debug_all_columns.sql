-- DEBUG ALL COLUMNS IN LEND_BORROW TABLE
-- Find any column that might have VARCHAR(8) constraint

-- Check ALL columns in lend_borrow table
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
ORDER BY ordinal_position;

-- Check if there are any other tables that might be involved
SELECT 
    table_name,
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE column_name LIKE '%transaction_id%' 
OR column_name LIKE '%lend%'
OR column_name LIKE '%borrow%'
ORDER BY table_name, column_name;

-- Check if the triggers are actually updated
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%lend_borrow%';

-- Check if the functions exist and are updated
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%lend_borrow%';
