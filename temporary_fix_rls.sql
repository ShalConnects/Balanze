-- Temporary fix: Disable RLS to test if that's the issue
-- WARNING: This is only for testing - re-enable RLS after fixing the issue

-- 1. Temporarily disable RLS
ALTER TABLE last_wish_settings DISABLE ROW LEVEL SECURITY;

-- 2. Grant full access to authenticated users
GRANT ALL ON last_wish_settings TO authenticated;

-- 3. Test if we can access the table now
SELECT 'RLS temporarily disabled for testing' as status;

-- 4. Check if there are any records
SELECT COUNT(*) as record_count FROM last_wish_settings;

-- 5. If this fixes the 406 error, then the issue is with RLS policies
-- After testing, you'll need to re-enable RLS with the correct policy
