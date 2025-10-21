-- Simple script to award basic achievements to existing users
-- This focuses on the most common achievements that users should have

-- First, let's see what we're working with
SELECT 'Starting basic achievement award process...' as status;

-- Award "First Account" to users who have accounts
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

SELECT 'Awarded First Account badges' as status;

-- Award "First Transaction" to users who have transactions
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

SELECT 'Awarded First Transaction badges' as status;

-- Award "Organizer" to users who have categories
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

SELECT 'Awarded Organizer badges' as status;

-- Award "Goal Setter" to users who have savings goals
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Goal Setter'
  AND EXISTS (SELECT 1 FROM savings_goals WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Goal Setter badges' as status;

-- Award "Lender" to users who have lend records
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Lender'
  AND EXISTS (SELECT 1 FROM lend_borrow WHERE user_id = u.id AND type = 'lend')
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Lender badges' as status;

-- Award "Borrower" to users who have borrow records
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Borrower'
  AND EXISTS (SELECT 1 FROM lend_borrow WHERE user_id = u.id AND type = 'borrow')
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Borrower badges' as status;

-- Award "Philanthropist" to users who have donations
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Philanthropist'
  AND EXISTS (SELECT 1 FROM donation_saving_records WHERE user_id = u.id AND type = 'donation')
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Philanthropist badges' as status;

-- Final summary
SELECT 'Basic achievement award process completed!' as status;
SELECT 
  COUNT(*) as total_achievements_awarded,
  COUNT(DISTINCT user_id) as users_with_achievements
FROM user_achievements;

-- Show summary by achievement type
SELECT 
  a.name as achievement_name,
  a.rarity,
  COUNT(ua.id) as times_awarded
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY a.name, a.rarity
ORDER BY times_awarded DESC;
