-- Award basic achievements to all existing users
-- This gives users some immediate achievements to see the system in action

-- Award "First Account" to users who have accounts
INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT
  a.user_id,
  ach.id as achievement_id
FROM accounts a
CROSS JOIN achievements ach
WHERE ach.name = 'First Account'
AND NOT EXISTS (
  SELECT 1 FROM user_achievements ua
  WHERE ua.user_id = a.user_id AND ua.achievement_id = ach.id
);

-- Award "First Transaction" to users who have transactions
INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT
  t.user_id,
  ach.id as achievement_id
FROM transactions t
CROSS JOIN achievements ach
WHERE ach.name = 'First Transaction'
AND NOT EXISTS (
  SELECT 1 FROM user_achievements ua
  WHERE ua.user_id = t.user_id AND ua.achievement_id = ach.id
);

-- Award "Organizer" to users who have categories
INSERT INTO user_achievements (user_id, achievement_id)
SELECT DISTINCT
  c.user_id,
  ach.id as achievement_id
FROM categories c
CROSS JOIN achievements ach
WHERE ach.name = 'Organizer'
AND NOT EXISTS (
  SELECT 1 FROM user_achievements ua
  WHERE ua.user_id = c.user_id AND ua.achievement_id = ach.id
);

-- Award "Multi-Account" to users who have 3+ accounts
INSERT INTO user_achievements (user_id, achievement_id)
SELECT
  user_id,
  ach.id as achievement_id
FROM (
  SELECT user_id, COUNT(*) as account_count
  FROM accounts
  GROUP BY user_id
  HAVING COUNT(*) >= 3
) account_counts
CROSS JOIN achievements ach
WHERE ach.name = 'Multi-Account'
AND NOT EXISTS (
  SELECT 1 FROM user_achievements ua
  WHERE ua.user_id = account_counts.user_id AND ua.achievement_id = ach.id
);

-- Award "Transaction Master" to users who have 10+ transactions
INSERT INTO user_achievements (user_id, achievement_id)
SELECT
  user_id,
  ach.id as achievement_id
FROM (
  SELECT user_id, COUNT(*) as transaction_count
  FROM transactions
  GROUP BY user_id
  HAVING COUNT(*) >= 10
) transaction_counts
CROSS JOIN achievements ach
WHERE ach.name = 'Transaction Master'
AND NOT EXISTS (
  SELECT 1 FROM user_achievements ua
  WHERE ua.user_id = transaction_counts.user_id AND ua.achievement_id = ach.id
);

-- Show summary of achievements awarded
SELECT 
  'Achievements Awarded' as summary,
  COUNT(*) as total_awards
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.earned_at >= NOW() - INTERVAL '1 minute';
