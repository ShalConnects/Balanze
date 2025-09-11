-- =====================================================
-- QUICK FIX: TRANSACTION_HISTORY RLS SECURITY
-- Fix the "unrestricted" issue in Supabase
-- =====================================================

-- Step 1: Re-enable Row Level Security
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Step 2: Create secure RLS policies
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

-- Step 3: Verify the fix
SELECT 
    'TRANSACTION_HISTORY SECURITY FIXED' as status,
    'RLS is now enabled with proper policies' as message;

-- Check RLS status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status
FROM pg_tables 
WHERE tablename = 'transaction_history';

-- Check policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'SELECT: ' || qual
        WHEN with_check IS NOT NULL THEN 'INSERT: ' || with_check
        ELSE 'No conditions'
    END as policy_details
FROM pg_policies 
WHERE tablename = 'transaction_history'
ORDER BY policyname; 