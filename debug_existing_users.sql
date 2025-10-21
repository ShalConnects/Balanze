-- Debug script to check why existing users don't have badges
-- This will help us identify the issue

-- 1. Check if we have any users in the system
SELECT 'User count check:' as debug_step;
SELECT COUNT(*) as total_users FROM auth.users;

-- 2. Check if we have any achievements defined
SELECT 'Achievement count check:' as debug_step;
SELECT COUNT(*) as total_achievements FROM achievements WHERE is_active = true;

-- 3. Check if any users have earned achievements
SELECT 'User achievements check:' as debug_step;
SELECT COUNT(*) as total_user_achievements FROM user_achievements;

-- 4. Check specific user data to see what they have
SELECT 'User data analysis:' as debug_step;
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
LIMIT 5;

-- 5. Check what achievements should be awarded based on user data
SELECT 'Achievement eligibility check:' as debug_step;
WITH user_stats AS (
  SELECT 
    u.id as user_id,
    u.email,
    (SELECT COUNT(*) FROM accounts WHERE user_id = u.id) as account_count,
    (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as transaction_count,
    (SELECT COUNT(*) FROM categories WHERE user_id = u.id) as category_count,
    (SELECT COUNT(*) FROM savings_goals WHERE user_id = u.id) as savings_goal_count,
    (SELECT COUNT(*) FROM lend_borrow WHERE user_id = u.id) as lend_borrow_count,
    (SELECT COUNT(*) FROM donation_saving_records WHERE user_id = u.id AND type = 'donation') as donation_count
  FROM auth.users u
)
SELECT 
  us.user_id,
  us.email,
  us.account_count,
  us.transaction_count,
  us.category_count,
  us.savings_goal_count,
  us.lend_borrow_count,
  us.donation_count,
  -- Check which achievements they should have
  CASE WHEN us.account_count >= 1 THEN 'First Account' ELSE NULL END as should_have_first_account,
  CASE WHEN us.transaction_count >= 1 THEN 'First Transaction' ELSE NULL END as should_have_first_transaction,
  CASE WHEN us.transaction_count >= 10 THEN 'Transaction Master' ELSE NULL END as should_have_transaction_master,
  CASE WHEN us.category_count >= 1 THEN 'Organizer' ELSE NULL END as should_have_organizer,
  CASE WHEN us.savings_goal_count >= 1 THEN 'Goal Setter' ELSE NULL END as should_have_goal_setter,
  CASE WHEN us.lend_borrow_count >= 1 THEN 'Lender' ELSE NULL END as should_have_lender,
  CASE WHEN us.donation_count >= 1 THEN 'Philanthropist' ELSE NULL END as should_have_philanthropist
FROM user_stats us
LIMIT 5;

-- 6. Check if the migration function exists and works
SELECT 'Migration function check:' as debug_step;
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%achievement%' 
   OR routine_name LIKE '%migrate%';

-- 7. Try to manually award a simple achievement to test
SELECT 'Manual achievement test:' as debug_step;
-- This will try to award "First Account" to users who have accounts
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

-- Check if the manual insert worked
SELECT 'Manual insert result:' as debug_step;
SELECT COUNT(*) as newly_awarded FROM user_achievements 
WHERE earned_at > NOW() - INTERVAL '1 minute';
