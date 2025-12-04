-- =====================================================
-- COMPREHENSIVE SECURITY AUDIT
-- Check all tables for RLS issues and "unrestricted" access
-- =====================================================

-- Step 1: Check all tables and their RLS status
SELECT '=== COMPREHENSIVE RLS AUDIT ===' as info;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled - SECURITY RISK!'
    END as details
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
ORDER BY 
    CASE WHEN rowsecurity THEN 1 ELSE 0 END,
    tablename;

-- Step 2: Count secured vs unrestricted tables
SELECT '=== SECURITY SUMMARY ===' as info;

SELECT 
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as secured_tables,
    COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as unrestricted_tables,
    ROUND(
        COUNT(CASE WHEN rowsecurity THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as security_percentage
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%';

-- Step 3: List all unrestricted tables (security risks)
SELECT '=== UNRESTRICTED TABLES (SECURITY RISKS) ===' as info;

SELECT 
    tablename,
    'UNRESTRICTED - IMMEDIATE ACTION REQUIRED' as risk_level,
    'Enable RLS and create policies' as recommended_action
FROM pg_tables 
WHERE schemaname = 'public'
    AND NOT rowsecurity
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- Step 4: Check RLS policies for secured tables
SELECT '=== RLS POLICIES AUDIT ===' as info;

SELECT 
    t.tablename,
    CASE 
        WHEN t.rowsecurity THEN 'SECURED'
        ELSE 'UNRESTRICTED'
    END as rls_status,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) = 0 AND t.rowsecurity THEN 'NO POLICIES - BLOCKED!'
        WHEN COUNT(p.policyname) > 0 THEN 'POLICIES EXIST'
        ELSE 'N/A'
    END as policy_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'information_schema%'
GROUP BY t.tablename, t.rowsecurity
ORDER BY 
    CASE WHEN t.rowsecurity THEN 1 ELSE 0 END,
    COUNT(p.policyname),
    t.tablename;

-- Step 5: Detailed policy analysis for each table
SELECT '=== DETAILED POLICY ANALYSIS ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'SELECT: ' || qual
        WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE: ' || with_check
        ELSE 'No conditions'
    END as policy_conditions
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
ORDER BY tablename, cmd, policyname;

-- Step 6: Check for common security issues
SELECT '=== COMMON SECURITY ISSUES ===' as info;

-- Check for overly permissive policies
SELECT 
    'Overly permissive policies found:' as issue_type,
    tablename,
    policyname,
    'Policy allows all operations' as issue_description
FROM pg_policies 
WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true')
    AND policyname NOT LIKE '%System%'
    AND policyname NOT LIKE '%insert%'
ORDER BY tablename;

-- Check for missing user_id references
SELECT 
    'Policies without user_id checks:' as issue_type,
    tablename,
    policyname,
    'Policy may not properly isolate user data' as issue_description
FROM pg_policies 
WHERE schemaname = 'public'
    AND (qual NOT LIKE '%auth.uid%' OR qual IS NULL)
    AND (with_check NOT LIKE '%auth.uid%' OR with_check IS NULL)
    AND cmd IN ('SELECT', 'UPDATE', 'DELETE')
    AND policyname NOT LIKE '%System%'
ORDER BY tablename;

-- Step 7: Generate fix recommendations
SELECT '=== SECURITY FIX RECOMMENDATIONS ===' as info;

-- For unrestricted tables
SELECT 
    'ENABLE RLS' as action,
    tablename,
    'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as sql_command
FROM pg_tables 
WHERE schemaname = 'public'
    AND NOT rowsecurity
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- For tables with no policies
SELECT 
    'CREATE POLICIES' as action,
    t.tablename,
    'Table has RLS enabled but no policies - all access blocked' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.rowsecurity
    AND p.policyname IS NULL
    AND t.tablename NOT LIKE 'pg_%'
ORDER BY t.tablename;

-- Step 8: Final security assessment
SELECT '=== FINAL SECURITY ASSESSMENT ===' as info;

WITH security_summary AS (
    SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN rowsecurity THEN 1 END) as secured_tables,
        COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as unrestricted_tables
    FROM pg_tables 
    WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'information_schema%'
)
SELECT 
    CASE 
        WHEN unrestricted_tables = 0 THEN 'EXCELLENT - All tables secured'
        WHEN unrestricted_tables <= 2 THEN 'GOOD - Minor security issues'
        WHEN unrestricted_tables <= 5 THEN 'FAIR - Security improvements needed'
        ELSE 'POOR - Significant security risks'
    END as overall_security_grade,
    total_tables as total_tables,
    secured_tables as secured_tables,
    unrestricted_tables as unrestricted_tables,
    ROUND(secured_tables * 100.0 / total_tables, 2) as security_percentage,
    CASE 
        WHEN unrestricted_tables > 0 THEN 'IMMEDIATE ACTION REQUIRED'
        ELSE 'Security is properly configured'
    END as action_required
FROM security_summary; 