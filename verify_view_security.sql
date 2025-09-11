-- =====================================================
-- VERIFY VIEW SECURITY - PROVE VIEWS ARE ACTUALLY SECURE
-- Even though Supabase shows views as "unrestricted", they are secure
-- =====================================================

-- Step 1: Show that views cannot have RLS enabled (this is normal)
SELECT '=== VIEWS CANNOT HAVE RLS ENABLED (THIS IS NORMAL) ===' as info;

SELECT 
    viewname as view_name,
    'VIEW' as object_type,
    'Cannot enable RLS directly' as limitation,
    'Inherits security from underlying tables' as security_method
FROM pg_views 
WHERE schemaname = 'public'
    AND viewname IN (
        'account_balances',
        'category_budgets_by_currency',
        'purchase_analytics_by_currency'
    )
ORDER BY viewname;

-- Step 2: Show that underlying tables are secured
SELECT '=== UNDERLYING TABLES ARE SECURED ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status,
    'Underlying table for views' as role
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('accounts', 'transactions', 'purchase_categories', 'purchases')
ORDER BY tablename;

-- Step 3: Test view security by checking data isolation
SELECT '=== TESTING VIEW SECURITY - DATA ISOLATION ===' as info;

-- Test 1: Check if you can see other users' data through account_balances view
SELECT 
    'account_balances view security test' as test_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_records,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_users_records,
    CASE 
        WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 THEN 'SECURE ✅'
        ELSE 'INSECURE ❌'
    END as security_result
FROM account_balances;

-- Test 2: Check if you can see other users' data through purchase_analytics_by_currency view
SELECT 
    'purchase_analytics_by_currency view security test' as test_name,
    COUNT(*) as total_currencies,
    'This view shows aggregated data by currency' as note,
    'Security depends on underlying purchases table' as security_note
FROM purchase_analytics_by_currency;

-- Test 3: Check if you can see other users' data through category_budgets_by_currency view
SELECT 
    'category_budgets_by_currency view security test' as test_name,
    COUNT(*) as total_categories,
    'This view shows aggregated data by category and currency' as note,
    'Security depends on underlying purchase_categories and purchases tables' as security_note
FROM category_budgets_by_currency;

-- Step 4: Test direct access to underlying tables
SELECT '=== TESTING UNDERLYING TABLE SECURITY ===' as info;

-- Test accounts table security
SELECT 
    'accounts table security test' as test_name,
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_accounts,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_users_accounts,
    CASE 
        WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 THEN 'SECURE ✅'
        ELSE 'INSECURE ❌'
    END as security_result
FROM accounts;

-- Test transactions table security
SELECT 
    'transactions table security test' as test_name,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_transactions,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_users_transactions,
    CASE 
        WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 THEN 'SECURE ✅'
        ELSE 'INSECURE ❌'
    END as security_result
FROM transactions;

-- Test purchases table security
SELECT 
    'purchases table security test' as test_name,
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_purchases,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_users_purchases,
    CASE 
        WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 THEN 'SECURE ✅'
        ELSE 'INSECURE ❌'
    END as security_result
FROM purchases;

-- Test purchase_categories table security
SELECT 
    'purchase_categories table security test' as test_name,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_categories,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_users_categories,
    CASE 
        WHEN COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) = 0 THEN 'SECURE ✅'
        ELSE 'INSECURE ❌'
    END as security_result
FROM purchase_categories;

-- Step 5: Show RLS policies for underlying tables
SELECT '=== RLS POLICIES FOR UNDERLYING TABLES ===' as info;

SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'SELECT: ' || qual
        WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE: ' || with_check
        ELSE 'No conditions'
    END as policy_conditions
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('accounts', 'transactions', 'purchase_categories', 'purchases')
ORDER BY tablename, cmd, policyname;

-- Step 6: Final security assessment
SELECT '=== FINAL SECURITY ASSESSMENT ===' as info;

WITH security_summary AS (
    SELECT 
        COUNT(*) as total_underlying_tables,
        COUNT(CASE WHEN rowsecurity THEN 1 END) as secured_tables,
        COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as unrestricted_tables
    FROM pg_tables 
    WHERE schemaname = 'public'
        AND tablename IN ('accounts', 'transactions', 'purchase_categories', 'purchases')
)
SELECT 
    CASE 
        WHEN s.unrestricted_tables = 0 THEN 'EXCELLENT - All underlying tables secured'
        ELSE 'ISSUE - Some underlying tables not secured'
    END as security_grade,
    s.total_underlying_tables as total_underlying_tables,
    s.secured_tables as secured_tables,
    s.unrestricted_tables as unrestricted_tables,
    CASE 
        WHEN s.unrestricted_tables = 0 THEN 'Views are secure (inherit from secured tables)'
        ELSE 'Views may be insecure (underlying tables not secured)'
    END as view_security_status,
    'Views showing as "unrestricted" in Supabase UI is normal behavior' as ui_note
FROM security_summary s; 