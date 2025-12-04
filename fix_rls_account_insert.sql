-- =====================================================
-- FIX RLS POLICY FOR ACCOUNT INSERTION
-- =====================================================

-- Step 1: Check current authentication status
SELECT '=== CHECKING AUTHENTICATION STATUS ===' as info;

-- Check if user is authenticated
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- Step 2: Verify RLS is enabled on accounts table
SELECT '=== CHECKING RLS STATUS ===' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'accounts';

-- Step 3: Check existing RLS policies
SELECT '=== CHECKING EXISTING RLS POLICIES ===' as info;

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
WHERE tablename = 'accounts'
ORDER BY policyname;

-- Step 4: Drop and recreate RLS policies with proper authentication checks
SELECT '=== RECREATING RLS POLICIES ===' as info;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

-- Create new policies with better authentication handling
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

-- Step 5: Create a test function to verify authentication
CREATE OR REPLACE FUNCTION test_account_insertion()
RETURNS TABLE (
    user_id UUID,
    is_authenticated BOOLEAN,
    auth_uid UUID,
    can_insert BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        auth.uid() IS NOT NULL as is_authenticated,
        auth.uid() as auth_uid,
        auth.uid() IS NOT NULL as can_insert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION test_account_insertion() TO authenticated;

-- Step 7: Create a debug function to check account insertion
CREATE OR REPLACE FUNCTION debug_account_insertion(
    p_name TEXT,
    p_type TEXT,
    p_initial_balance DECIMAL,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS TABLE (
    success BOOLEAN,
    error_message TEXT,
    user_id UUID,
    is_authenticated BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_is_authenticated BOOLEAN;
    v_error_message TEXT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    v_is_authenticated := v_user_id IS NOT NULL;
    
    -- Try to insert account
    BEGIN
        INSERT INTO accounts (
            user_id,
            name,
            type,
            initial_balance,
            calculated_balance,
            currency,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            p_name,
            p_type,
            p_initial_balance,
            p_initial_balance,
            p_currency,
            true,
            NOW(),
            NOW()
        );
        
        RETURN QUERY SELECT true, NULL, v_user_id, v_is_authenticated;
        
    EXCEPTION WHEN OTHERS THEN
        v_error_message := SQLERRM;
        RETURN QUERY SELECT false, v_error_message, v_user_id, v_is_authenticated;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Verify the fix
SELECT '=== TESTING ACCOUNT INSERTION ===' as info;

-- Test the debug function
SELECT * FROM debug_account_insertion('Test Account', 'checking', 100.00, 'USD');

-- Step 9: Show final RLS policy status
SELECT '=== FINAL RLS POLICY STATUS ===' as info;

SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'accounts'
ORDER BY policyname;

-- Step 10: Create a simple test account insertion
SELECT '=== CREATING TEST ACCOUNT ===' as info;

-- This should work if the user is authenticated
DO $$
DECLARE
    v_user_id UUID;
    v_test_account_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO accounts (
            user_id,
            name,
            type,
            initial_balance,
            calculated_balance,
            currency,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'Test Account - ' || NOW(),
            'checking',
            100.00,
            100.00,
            'USD',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO v_test_account_id;
        
        RAISE NOTICE 'Test account created with ID: %', v_test_account_id;
        
        -- Clean up test account
        DELETE FROM accounts WHERE id = v_test_account_id;
        RAISE NOTICE 'Test account cleaned up';
        
    ELSE
        RAISE NOTICE 'User not authenticated';
    END IF;
END $$;

SELECT '=== RLS FIX COMPLETE ===' as info; 