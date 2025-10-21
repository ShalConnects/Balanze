-- Comprehensive diagnostic script to identify why achievements aren't working
-- This will check every possible issue

-- 1. Check if achievements table exists and has data
SELECT '=== ACHIEVEMENTS TABLE CHECK ===' as section;
SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_achievements
FROM achievements;

-- Show all achievements
SELECT 'All achievements:' as info;
SELECT id, name, is_active, rarity FROM achievements ORDER BY name;

-- 2. Check if users exist
SELECT '=== USERS CHECK ===' as section;
SELECT COUNT(*) as total_users FROM auth.users;

-- Show first few users
SELECT 'Sample users:' as info;
SELECT id, email FROM auth.users LIMIT 3;

-- 3. Check if users have accounts
SELECT '=== ACCOUNTS CHECK ===' as section;
SELECT 
  COUNT(*) as total_accounts,
  COUNT(DISTINCT user_id) as users_with_accounts
FROM accounts;

-- Show users with accounts
SELECT 'Users with accounts:' as info;
SELECT 
  u.id as user_id,
  u.email,
  COUNT(a.id) as account_count
FROM auth.users u
LEFT JOIN accounts a ON u.id = a.user_id
GROUP BY u.id, u.email
HAVING COUNT(a.id) > 0
LIMIT 3;

-- 4. Check if users have transactions
SELECT '=== TRANSACTIONS CHECK ===' as section;
SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT user_id) as users_with_transactions
FROM transactions;

-- Show users with transactions
SELECT 'Users with transactions:' as info;
SELECT 
  u.id as user_id,
  u.email,
  COUNT(t.id) as transaction_count
FROM auth.users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.email
HAVING COUNT(t.id) > 0
LIMIT 3;

-- 5. Check if users have categories
SELECT '=== CATEGORIES CHECK ===' as section;
SELECT 
  COUNT(*) as total_categories,
  COUNT(DISTINCT user_id) as users_with_categories
FROM categories;

-- 6. Check if users have savings goals
SELECT '=== SAVINGS GOALS CHECK ===' as section;
SELECT 
  COUNT(*) as total_savings_goals,
  COUNT(DISTINCT user_id) as users_with_savings_goals
FROM savings_goals;

-- 7. Check if users have lend/borrow records
SELECT '=== LEND/BORROW CHECK ===' as section;
SELECT 
  COUNT(*) as total_lend_borrow,
  COUNT(DISTINCT user_id) as users_with_lend_borrow
FROM lend_borrow;

-- 8. Check if users have donations
SELECT '=== DONATIONS CHECK ===' as section;
SELECT 
  COUNT(*) as total_donations,
  COUNT(DISTINCT user_id) as users_with_donations
FROM donation_saving_records WHERE type = 'donation';

-- 9. Check user_achievements table
SELECT '=== USER ACHIEVEMENTS CHECK ===' as section;
SELECT COUNT(*) as total_user_achievements FROM user_achievements;

-- 10. Test the exact query that should work
SELECT '=== QUERY TEST ===' as section;
SELECT 'Testing First Account query:' as info;

-- This is the exact query from our script
SELECT 
  u.id as user_id,
  a.id as achievement_id,
  a.name as achievement_name,
  'User has accounts: ' || (SELECT COUNT(*) FROM accounts WHERE user_id = u.id) as user_accounts,
  'Achievement exists: ' || (a.id IS NOT NULL) as achievement_exists
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'First Account'
  AND EXISTS (SELECT 1 FROM accounts WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  )
LIMIT 5;

-- 11. Check if there are any RLS issues
SELECT '=== RLS CHECK ===' as section;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'user_achievements';

-- 12. Try a simple insert to test permissions
SELECT '=== PERMISSION TEST ===' as section;
SELECT 'Testing if we can insert into user_achievements...' as info;

-- Try to insert a test record (this might fail, but we'll see the error)
DO $$
BEGIN
  -- This will only work if we have users and achievements
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) AND EXISTS (SELECT 1 FROM achievements LIMIT 1) THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT 
      (SELECT id FROM auth.users LIMIT 1),
      (SELECT id FROM achievements LIMIT 1)
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = (SELECT id FROM auth.users LIMIT 1)
      AND ua.achievement_id = (SELECT id FROM achievements LIMIT 1)
    );
    RAISE NOTICE 'Test insert successful';
  ELSE
    RAISE NOTICE 'No users or achievements found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- Check if the test insert worked
SELECT 'Test insert result:' as info;
SELECT COUNT(*) as test_achievements FROM user_achievements 
WHERE earned_at > NOW() - INTERVAL '1 minute';
