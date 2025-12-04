-- Debug script to check achievement migration results
-- Run this to see what happened with the migration

-- 1. Check if achievements table has data
SELECT 'Achievements in database:' as check_type, COUNT(*) as count FROM achievements;

-- 2. Check if any users have achievements
SELECT 'Users with achievements:' as check_type, COUNT(DISTINCT user_id) as count FROM user_achievements;

-- 3. Check specific user achievements (replace with your user ID)
SELECT 'User achievements:' as check_type, 
       ua.user_id, 
       a.name as achievement_name,
       a.icon,
       ua.earned_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY ua.earned_at DESC;

-- 4. Check if users exist in the system
SELECT 'Total users in system:' as check_type, COUNT(DISTINCT user_id) as count FROM (
    SELECT user_id FROM accounts
    UNION
    SELECT user_id FROM transactions
    UNION
    SELECT user_id FROM categories
) AS all_users;

-- 5. Check specific user data counts (replace with your user ID)
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
SELECT 'User data counts:' as check_type,
       (SELECT COUNT(*) FROM accounts WHERE user_id = 'YOUR_USER_ID_HERE') as accounts,
       (SELECT COUNT(*) FROM transactions WHERE user_id = 'YOUR_USER_ID_HERE') as transactions,
       (SELECT COUNT(*) FROM categories WHERE user_id = 'YOUR_USER_ID_HERE') as categories,
       (SELECT COUNT(*) FROM savings_goals WHERE user_id = 'YOUR_USER_ID_HERE') as savings_goals,
       (SELECT COUNT(*) FROM lend_borrow WHERE user_id = 'YOUR_USER_ID_HERE') as lend_borrow,
       (SELECT COUNT(*) FROM purchases WHERE user_id = 'YOUR_USER_ID_HERE') as purchases,
       (SELECT COUNT(*) FROM donation_saving_records WHERE user_id = 'YOUR_USER_ID_HERE' AND type = 'donation') as donations;

-- 6. Check if achievement names match exactly
SELECT 'Achievement names:' as check_type, name, icon, rarity FROM achievements WHERE is_active = true ORDER BY name;
