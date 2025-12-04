-- Quick RLS Fix for Account Insertion
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure RLS is enabled
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

-- Step 3: Create new policies with proper authentication checks
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 4: Verify the policies
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

-- Step 5: Test the fix (this will only work if you're authenticated)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'User authenticated: %', v_user_id;
        
        -- Try to insert a test account
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
        );
        
        RAISE NOTICE 'Test account created successfully!';
        
        -- Clean up
        DELETE FROM accounts 
        WHERE user_id = v_user_id 
        AND name LIKE 'Test Account - %';
        
        RAISE NOTICE 'Test account cleaned up';
        
    ELSE
        RAISE NOTICE 'No user authenticated - this is expected if running from SQL editor';
    END IF;
END $$;

SELECT 'RLS fix applied successfully!' as status; 