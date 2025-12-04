-- Test the complete achievement flow
-- 1. Create achievements, 2. Award them to users

-- Step 1: Create achievements if they don't exist
INSERT INTO achievements (name, description, icon, rarity, category, requirements, points, is_active)
SELECT * FROM (VALUES
  ('First Account', 'Create your first account', '🏦', 'bronze', 'account', '{"action": "create_account", "count": 1}'::jsonb, 10, true),
  ('First Transaction', 'Record your first transaction', '💰', 'bronze', 'transaction', '{"action": "create_transaction", "count": 1}'::jsonb, 10, true),
  ('Organizer', 'Create your first category', '📁', 'bronze', 'category', '{"action": "create_category", "count": 1}'::jsonb, 10, true)
) AS new_achievements(name, description, icon, rarity, category, requirements, points, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements a WHERE a.name = new_achievements.name
);

-- Step 2: Check what we have
SELECT 'Achievements created:' as status;
SELECT COUNT(*) as achievement_count FROM achievements;

-- Step 3: Check users and their data
SELECT 'User data summary:' as status;
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM accounts) as total_accounts,
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT COUNT(*) FROM categories) as total_categories;

-- Step 4: Try to award "First Account" to users who have accounts
SELECT 'Awarding First Account...' as status;
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
  );

-- Step 5: Try to award "First Transaction" to users who have transactions
SELECT 'Awarding First Transaction...' as status;
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'First Transaction'
  AND EXISTS (SELECT 1 FROM transactions WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

-- Step 6: Try to award "Organizer" to users who have categories
SELECT 'Awarding Organizer...' as status;
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Organizer'
  AND EXISTS (SELECT 1 FROM categories WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

-- Step 7: Check results
SELECT 'Final results:' as status;
SELECT 
  COUNT(*) as total_user_achievements,
  COUNT(DISTINCT user_id) as users_with_achievements
FROM user_achievements;

-- Show what was awarded
SELECT 'Awarded achievements:' as status;
SELECT 
  ua.user_id,
  a.name as achievement_name,
  a.rarity,
  ua.earned_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY ua.earned_at DESC;
