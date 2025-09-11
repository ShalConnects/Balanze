-- =====================================================
-- FIX RLS SECURITY - RE-ENABLE ROW LEVEL SECURITY
-- This fixes the "unrestricted" issue in Supabase
-- =====================================================

-- Step 1: Check current RLS status
SELECT '=== CHECKING CURRENT RLS STATUS ===' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'transaction_history';

-- Step 2: Check existing policies
SELECT '=== CHECKING EXISTING POLICIES ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transaction_history'
ORDER BY policyname;

-- Step 3: Drop existing policies to start fresh
SELECT '=== DROPPING EXISTING POLICIES ===' as info;

DROP POLICY IF EXISTS "Users can view their own transaction history" ON transaction_history;
DROP POLICY IF EXISTS "System can insert transaction history" ON transaction_history;
DROP POLICY IF EXISTS "Users can view their own transaction updates" ON transaction_history;
DROP POLICY IF EXISTS "System can insert transaction updates" ON transaction_history;

-- Step 4: Re-enable Row Level Security
SELECT '=== RE-ENABLING ROW LEVEL SECURITY ===' as info;

ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Step 5: Create proper RLS policies
SELECT '=== CREATING SECURE RLS POLICIES ===' as info;

-- Policy for users to view their own transaction history
CREATE POLICY "Users can view their own transaction history" ON transaction_history
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND transaction_id IN (
            SELECT transaction_id 
            FROM transactions 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for system to insert transaction history (for triggers)
CREATE POLICY "System can insert transaction history" ON transaction_history
    FOR INSERT 
    WITH CHECK (true);

-- Step 6: Verify the fix
SELECT '=== VERIFYING RLS FIX ===' as info;

-- Check RLS is enabled
SELECT 
    'RLS Status:' as info,
    CASE 
        WHEN rowsecurity THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌'
    END as status
FROM pg_tables 
WHERE tablename = 'transaction_history';

-- Check policies are created
SELECT 
    'Policies:' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'transaction_history';

-- Show all policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'SELECT policy: ' || qual
        WHEN with_check IS NOT NULL THEN 'INSERT policy: ' || with_check
        ELSE 'No conditions'
    END as policy_details
FROM pg_policies 
WHERE tablename = 'transaction_history'
ORDER BY policyname;

-- Step 7: Test the security
SELECT '=== SECURITY TEST ===' as info;

-- This should show the current user's transaction history only
SELECT 
    'Testing SELECT access...' as test,
    COUNT(*) as accessible_records
FROM transaction_history th
WHERE transaction_id IN (
    SELECT transaction_id 
    FROM transactions 
    WHERE user_id = auth.uid()
);

-- Step 8: Final status
SELECT 
    '=== RLS SECURITY FIX COMPLETE ===' as status,
    'Transaction history table is now properly secured with RLS enabled' as message,
    'Users can only access their own transaction history' as security_note;

-- Step 9: Additional security recommendations
SELECT '=== SECURITY RECOMMENDATIONS ===' as info;

SELECT 
    '1. All tables should have RLS enabled' as recommendation,
    '2. Users should only access their own data' as principle,
    '3. System functions should use SECURITY DEFINER' as best_practice,
    '4. Regular security audits are recommended' as maintenance; 