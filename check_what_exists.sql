-- =====================================================
-- CHECK WHAT TABLES AND COLUMNS EXIST
-- =====================================================

-- List all tables in public schema
SELECT '=== ALL TABLES IN PUBLIC SCHEMA ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check which tables have user_id columns
SELECT '=== TABLES WITH USER_ID COLUMNS ===' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%user%'
ORDER BY table_name, column_name;

-- Check which tables have profile_id columns
SELECT '=== TABLES WITH PROFILE_ID COLUMNS ===' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE '%profile%'
ORDER BY table_name, column_name;

-- Check savings_goals table specifically
SELECT '=== SAVINGS_GOALS TABLE DETAILS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'savings_goals' 
AND table_schema = 'public'
ORDER BY ordinal_position; 