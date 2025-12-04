-- =====================================================
-- CHECK ACTUAL TABLE SCHEMAS
-- =====================================================

-- Check all table schemas to understand the correct column names
SELECT '=== SAVINGS_GOALS TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'savings_goals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== ACCOUNTS TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== TRANSACTIONS TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== PURCHASES TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== LEND_BORROW TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== NOTIFICATIONS TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== LAST_WISH_SETTINGS TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'last_wish_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== LAST_WISH_DELIVERIES TABLE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'last_wish_deliveries' 
AND table_schema = 'public'
ORDER BY ordinal_position; 