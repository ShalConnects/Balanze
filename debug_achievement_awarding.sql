-- Debug script to understand why achievements aren't being awarded
-- This will help us identify the root cause

-- 1. Check if we have any users
SELECT 'Step 1: User count' as debug_step;
SELECT COUNT(*) as user_count FROM auth.users;

-- 2. Check if we have any achievements defined
SELECT 'Step 2: Achievement count' as debug_step;
SELECT COUNT(*) as achievement_count FROM achievements WHERE is_active = true;

-- 3. Check specific achievements we're trying to award
SELECT 'Step 3: Specific achievements' as debug_step;
SELECT name, id, is_active FROM achievements 
WHERE name IN ('First Account', 'First Transaction', 'Organizer', 'Goal Setter', 'Lender', 'Borrower', 'Philanthropist')
ORDER BY name;

-- 4. Check if users have the required data
SELECT 'Step 4: User data analysis' as debug_step;
SELECT 
  u.id as user_id,
  u.email,
  -- Check accounts
  (SELECT COUNT(*) FROM accounts WHERE user_id = u.id) as account_count,
  -- Check transactions  
  (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as transaction_count,
  -- Check categories
  (SELECT COUNT(*) FROM categories WHERE user_id = u.id) as category_count,
  -- Check savings goals
  (SELECT COUNT(*) FROM savings_goals WHERE user_id = u.id) as savings_goal_count,
  -- Check lend/borrow records
  (SELECT COUNT(*) FROM lend_borrow WHERE user_id = u.id) as lend_borrow_count,
  -- Check donations
  (SELECT COUNT(*) FROM donation_saving_records WHERE user_id = u.id AND type = 'donation') as donation_count
FROM auth.users u
LIMIT 3;

-- 5. Test the exact query for First Account
SELECT 'Step 5: First Account test query' as debug_step;
SELECT 
  u.id as user_id,
  a.id as achievement_id,
  a.name as achievement_name
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'First Account'
  AND EXISTS (SELECT 1 FROM accounts WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  )
LIMIT 5;

-- 6. Check if there are any existing user achievements
SELECT 'Step 6: Existing user achievements' as debug_step;
SELECT COUNT(*) as existing_achievements FROM user_achievements;

-- 7. Check if the achievements table has the right structure
SELECT 'Step 7: Achievement table structure' as debug_step;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'achievements' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Try a simple test insert
SELECT 'Step 8: Test insert' as debug_step;
-- This will try to insert one achievement to see if it works
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'First Account'
  AND EXISTS (SELECT 1 FROM accounts WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  )
LIMIT 1;

-- Check if the test insert worked
SELECT 'Step 9: Test insert result' as debug_step;
SELECT COUNT(*) as newly_awarded FROM user_achievements 
WHERE earned_at > NOW() - INTERVAL '1 minute';
