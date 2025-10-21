-- Test script to verify achievement system is working
-- Run this after setting up the achievement system

-- Check if achievement tables exist and have data
SELECT 'Achievements table check:' as test_name;
SELECT COUNT(*) as achievement_count FROM achievements WHERE is_active = true;

-- Check if user_achievement_summary view works
SELECT 'User achievement summary view check:' as test_name;
SELECT COUNT(*) as summary_count FROM user_achievement_summary;

-- Check if we can query achievements for a specific user (replace with actual user ID)
SELECT 'User achievements check:' as test_name;
SELECT 
  ua.user_id,
  COUNT(ua.id) as earned_achievements,
  a.name as achievement_name,
  a.rarity
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY ua.user_id, a.name, a.rarity
LIMIT 5;

-- Check achievement summary for all users
SELECT 'Achievement summary check:' as test_name;
SELECT 
  user_id,
  total_achievements,
  bronze_badges,
  silver_badges,
  gold_badges,
  total_points
FROM user_achievement_summary
LIMIT 5;

-- Test if we can insert a test achievement (this will be rolled back)
BEGIN;
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT 
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM achievements WHERE name = 'First Account' LIMIT 1)
  WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
  AND EXISTS (SELECT 1 FROM achievements WHERE name = 'First Account' LIMIT 1);
  
  -- Check if the insert worked
  SELECT 'Test insert check:' as test_name;
  SELECT COUNT(*) as test_insert_count FROM user_achievements 
  WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
ROLLBACK;

-- Check RLS policies are working
SELECT 'RLS policies check:' as test_name;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('achievements', 'user_achievements', 'achievement_progress', 'lend_borrow')
ORDER BY tablename, policyname;
