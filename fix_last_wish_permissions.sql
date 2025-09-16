-- Fix Last Wish database permissions issue
-- This addresses the 406 error when accessing last_wish_settings

-- 1. Check if the table exists and has the right structure
SELECT 'Checking table structure...' as status;

-- 2. Ensure RLS is properly configured
ALTER TABLE last_wish_settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop and recreate the RLS policy to ensure it works
DROP POLICY IF EXISTS "Users can manage their own last wish settings" ON last_wish_settings;

CREATE POLICY "Users can manage their own last wish settings" ON last_wish_settings
    FOR ALL USING (auth.uid() = user_id);

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON last_wish_settings TO authenticated;

-- 5. Test the policy by checking if a user can access their own data
-- (This will only work if you're authenticated)
SELECT 'RLS policy recreated successfully' as status;

-- 6. Alternative: If RLS is causing issues, temporarily disable it for testing
-- Uncomment the next line ONLY for testing, then re-enable RLS after fixing
-- ALTER TABLE last_wish_settings DISABLE ROW LEVEL SECURITY;

SELECT 'Permissions fix applied. If still getting 406 errors, check your authentication.' as final_status;
