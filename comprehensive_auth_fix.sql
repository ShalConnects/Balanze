-- Comprehensive Auth Fix for Supabase
-- This fixes both duplicate email prevention and RLS policy issues

-- =====================================================
-- PART 1: FIX DUPLICATE EMAIL PREVENTION
-- =====================================================

-- Step 1: Drop existing triggers and functions
DROP TRIGGER IF EXISTS prevent_duplicate_email ON auth.users;
DROP TRIGGER IF EXISTS prevent_duplicate_email_update ON auth.users;
DROP FUNCTION IF EXISTS prevent_duplicate_email_signup();
DROP FUNCTION IF EXISTS prevent_duplicate_signup();

-- Step 2: Create a robust duplicate prevention function
CREATE OR REPLACE FUNCTION prevent_duplicate_email_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email already exists (case insensitive)
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE LOWER(email) = LOWER(NEW.email)
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    ) THEN
        RAISE EXCEPTION 'User with this email address already exists. Please use a different email or try logging in.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create triggers for both INSERT and UPDATE
CREATE TRIGGER prevent_duplicate_email_insert
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_email_signup();

CREATE TRIGGER prevent_duplicate_email_update
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_email_signup();

-- Step 4: Create a function to check email existence
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(email_to_check);
    
    RETURN user_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: FIX RLS POLICIES FOR ACCOUNTS
-- =====================================================

-- Step 5: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

-- Step 6: Create robust RLS policies
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL 
        AND user_id = auth.uid()
    );

-- =====================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- =====================================================

-- Step 7: Create a function to safely create cash account
CREATE OR REPLACE FUNCTION create_cash_account(
    p_currency TEXT DEFAULT 'USD',
    p_initial_balance DECIMAL DEFAULT 0.00
)
RETURNS TABLE (
    success BOOLEAN,
    account_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_account_id UUID;
    v_error_message TEXT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'User not authenticated';
        RETURN;
    END IF;
    
    -- Check if user already has a cash account
    IF EXISTS (
        SELECT 1 FROM accounts 
        WHERE user_id = v_user_id 
        AND type = 'cash' 
        AND currency = p_currency
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Cash account already exists for this currency';
        RETURN;
    END IF;
    
    -- Create cash account
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
            'Cash Wallet',
            'cash',
            p_initial_balance,
            p_initial_balance,
            p_currency,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO v_account_id;
        
        RETURN QUERY SELECT true, v_account_id, NULL;
        
    EXCEPTION WHEN OTHERS THEN
        v_error_message := SQLERRM;
        RETURN QUERY SELECT false, NULL::UUID, v_error_message;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION create_cash_account(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;

-- =====================================================
-- PART 4: VERIFICATION AND TESTING
-- =====================================================

-- Step 9: Verify triggers were created
SELECT '=== VERIFYING TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%prevent_duplicate_email%';

-- Step 10: Verify RLS policies
SELECT '=== VERIFYING RLS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'accounts'
ORDER BY policyname;

-- Step 11: Show current duplicate emails (if any)
SELECT '=== CHECKING FOR DUPLICATE EMAILS ===' as info;
SELECT 
    email, 
    COUNT(*) as user_count
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 12: Test email existence function
SELECT '=== TESTING EMAIL CHECK FUNCTION ===' as info;
SELECT check_email_exists('shalconnect00@gmail.com') as email_exists;

-- Instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. The triggers will prevent new duplicate emails
-- 3. RLS policies will allow authenticated users to create accounts
-- 4. Test signup with existing email - should now show error
-- 5. Test account creation - should now work for authenticated users 