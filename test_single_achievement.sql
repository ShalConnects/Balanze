-- Very simple test to award just one achievement
-- This will help us debug step by step

-- First, let's see what we have
SELECT 'Current state:' as info;
SELECT 
  (SELECT COUNT(*) FROM auth.users) as user_count,
  (SELECT COUNT(*) FROM achievements WHERE is_active = true) as achievement_count,
  (SELECT COUNT(*) FROM user_achievements) as existing_user_achievements;

-- Check if we have the "First Account" achievement
SELECT 'First Account achievement:' as info;
SELECT id, name, is_active FROM achievements WHERE name = 'First Account';

-- Check if any users have accounts
SELECT 'Users with accounts:' as info;
SELECT COUNT(*) as users_with_accounts 
FROM auth.users u 
WHERE EXISTS (SELECT 1 FROM accounts WHERE user_id = u.id);

-- Try to award "First Account" to the first user who has an account
SELECT 'Attempting to award First Account...' as info;

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

-- Check if it worked
SELECT 'Result:' as info;
SELECT COUNT(*) as newly_awarded FROM user_achievements 
WHERE earned_at > NOW() - INTERVAL '1 minute';

-- Show the newly awarded achievement
SELECT 'Newly awarded achievement:' as info;
SELECT 
  ua.id,
  ua.user_id,
  ua.earned_at,
  a.name as achievement_name,
  a.rarity
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.earned_at > NOW() - INTERVAL '1 minute';
