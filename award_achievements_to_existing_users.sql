-- Comprehensive script to award achievements to all existing users
-- This will check each user's data and award appropriate achievements

-- First, let's see what we're working with
SELECT 'Starting achievement award process...' as status;

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

-- Award "Transaction Master" to users who have 10+ transactions
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Transaction Master'
  AND (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) >= 10
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Transaction Master badges' as status;

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

-- Award "Multi-Currency" to users who have accounts in different currencies
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Multi-Currency'
  AND (SELECT COUNT(DISTINCT currency) FROM accounts WHERE user_id = u.id) >= 2
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Multi-Currency badges' as status;

-- Award "Savings Champion" to users who have saved significant amounts
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Savings Champion'
  AND (SELECT COALESCE(SUM(amount), 0) FROM savings_goals WHERE user_id = u.id) >= 1000
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Savings Champion badges' as status;

-- Award "Goal Crusher" to users who have completed savings goals
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Goal Crusher'
  AND EXISTS (
    SELECT 1 FROM savings_goals 
    WHERE user_id = u.id AND amount >= target_amount
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Goal Crusher badges' as status;

-- Award "Settlement Master" to users who have settled loans
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Settlement Master'
  AND EXISTS (SELECT 1 FROM lend_borrow WHERE user_id = u.id AND status = 'settled')
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Settlement Master badges' as status;

-- Award "Big Spender" to users who have made large purchases
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Big Spender'
  AND EXISTS (SELECT 1 FROM purchases WHERE user_id = u.id AND amount >= 500)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Big Spender badges' as status;

-- Award "Document Keeper" to users who have uploaded attachments
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Document Keeper'
  AND EXISTS (SELECT 1 FROM purchase_attachments WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Document Keeper badges' as status;

-- Award "Investor" to users who have investments
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Investor'
  AND EXISTS (SELECT 1 FROM investment_assets WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Investor badges' as status;

-- Award "Generous Heart" to users who have made significant donations
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Generous Heart'
  AND (SELECT COALESCE(SUM(amount), 0) FROM donation_saving_records WHERE user_id = u.id AND type = 'donation') >= 500
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Generous Heart badges' as status;

-- Award "Planner" to users who have last wish settings
INSERT INTO user_achievements (user_id, achievement_id)
SELECT 
  u.id as user_id,
  a.id as achievement_id
FROM auth.users u
CROSS JOIN achievements a
WHERE a.name = 'Planner'
  AND EXISTS (SELECT 1 FROM last_wish_settings WHERE user_id = u.id)
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

SELECT 'Awarded Planner badges' as status;

-- Final summary
SELECT 'Achievement award process completed!' as status;
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
