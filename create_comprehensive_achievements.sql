-- Create comprehensive achievement system
-- Based on the detailed categories provided

-- First, let's see what we currently have
SELECT 'Current achievements count:' as info;
SELECT COUNT(*) as current_count FROM achievements WHERE is_active = true;

-- Insert all comprehensive achievements
INSERT INTO achievements (name, description, icon, rarity, category, requirements, points, is_active)
SELECT * FROM (VALUES
  -- GETTING STARTED (4 badges)
  ('First Account', 'Create your first account', '🏦', 'bronze', 'getting_started', '{"action": "create_account", "count": 1}'::jsonb, 10, true),
  ('First Transaction', 'Record your first transaction', '💰', 'bronze', 'getting_started', '{"action": "create_transaction", "count": 1}'::jsonb, 10, true),
  ('Organizer', 'Create your first category', '📁', 'bronze', 'getting_started', '{"action": "create_category", "count": 1}'::jsonb, 10, true),
  ('Goal Setter', 'Create your first savings goal', '🎯', 'bronze', 'getting_started', '{"action": "create_savings_goal", "count": 1}'::jsonb, 20, true),
  
  -- FINANCIAL TRACKING (4 badges)
  ('Daily Tracker', 'Track expenses for 7 consecutive days', '📊', 'silver', 'tracking', '{"action": "daily_tracking", "days": 7}'::jsonb, 50, true),
  ('Transaction Master', 'Record 10 transactions', '📈', 'silver', 'tracking', '{"action": "create_transaction", "count": 10}'::jsonb, 50, true),
  ('Consistent Logger', 'Log transactions for 30 days', '📅', 'gold', 'tracking', '{"action": "daily_tracking", "days": 30}'::jsonb, 100, true),
  ('Data Enthusiast', 'Record 100 transactions', '📊', 'gold', 'tracking', '{"action": "create_transaction", "count": 100}'::jsonb, 150, true),
  
  -- ACCOUNT MANAGEMENT (3 badges)
  ('Multi-Account', 'Create 3 different accounts', '🏛️', 'silver', 'accounts', '{"action": "create_account", "count": 3}'::jsonb, 40, true),
  ('Multi-Currency', 'Use 2 different currencies', '🌍', 'silver', 'accounts', '{"action": "multi_currency", "currencies": 2}'::jsonb, 40, true),
  ('Account Master', 'Create 5 different accounts', '👑', 'gold', 'accounts', '{"action": "create_account", "count": 5}'::jsonb, 100, true),
  
  -- SAVINGS & GOALS (3 badges)
  ('Savings Starter', 'Save your first $100', '💵', 'bronze', 'savings', '{"action": "savings_amount", "amount": 100}'::jsonb, 30, true),
  ('Savings Champion', 'Save $1000 or more', '💎', 'gold', 'savings', '{"action": "savings_amount", "amount": 1000}'::jsonb, 200, true),
  ('Goal Crusher', 'Complete your first savings goal', '🎯', 'silver', 'savings', '{"action": "complete_goal", "count": 1}'::jsonb, 60, true),
  
  -- LEND & BORROW (3 badges)
  ('Lender', 'Lend money to someone', '🤝', 'silver', 'lend_borrow', '{"action": "create_lend_record", "count": 1}'::jsonb, 30, true),
  ('Borrower', 'Borrow money from someone', '📝', 'silver', 'lend_borrow', '{"action": "create_borrow_record", "count": 1}'::jsonb, 30, true),
  ('Settlement Master', 'Settle a loan completely', '✅', 'gold', 'lend_borrow', '{"action": "settle_loan", "count": 1}'::jsonb, 80, true),
  
  -- PURCHASE TRACKING (2 badges)
  ('Purchase Tracker', 'Track your first purchase', '🛒', 'bronze', 'purchases', '{"action": "create_purchase", "count": 1}'::jsonb, 20, true),
  ('Document Keeper', 'Upload your first receipt', '📄', 'silver', 'purchases', '{"action": "upload_attachment", "count": 1}'::jsonb, 40, true),
  
  -- INVESTMENT (2 badges)
  ('Investor', 'Create your first investment', '📈', 'silver', 'investments', '{"action": "create_investment", "count": 1}'::jsonb, 50, true),
  ('Portfolio Manager', 'Track 5 different investments', '💼', 'gold', 'investments', '{"action": "create_investment", "count": 5}'::jsonb, 120, true),
  
  -- ANALYTICS (2 badges)
  ('Data Explorer', 'View your analytics dashboard', '📊', 'bronze', 'analytics', '{"action": "view_analytics", "count": 1}'::jsonb, 25, true),
  ('Insight Seeker', 'View analytics 10 times', '🔍', 'silver', 'analytics', '{"action": "view_analytics", "count": 10}'::jsonb, 60, true),
  
  -- DONATIONS (2 badges)
  ('Philanthropist', 'Make your first donation', '❤️', 'gold', 'donations', '{"action": "create_donation", "count": 1}'::jsonb, 100, true),
  ('Generous Heart', 'Donate $500 or more', '💝', 'diamond', 'donations', '{"action": "donation_total", "amount": 500}'::jsonb, 300, true),
  
  -- CONSISTENCY (3 badges)
  ('Daily User', 'Use the app for 7 consecutive days', '📱', 'silver', 'consistency', '{"action": "daily_login", "days": 7}'::jsonb, 50, true),
  ('Loyal User', 'Use the app for 30 consecutive days', '🏆', 'gold', 'consistency', '{"action": "daily_login", "days": 30}'::jsonb, 150, true),
  ('Power User', 'Use the app for 100 consecutive days', '⚡', 'diamond', 'consistency', '{"action": "daily_login", "days": 100}'::jsonb, 500, true),
  
  -- PREMIUM FEATURES (2 badges)
  ('Premium Explorer', 'Use your first premium feature', '⭐', 'gold', 'premium', '{"action": "use_premium_feature", "count": 1}'::jsonb, 100, true),
  ('Premium Power User', 'Use 5 different premium features', '💎', 'diamond', 'premium', '{"action": "use_premium_feature", "count": 5}'::jsonb, 300, true),
  
  -- SPECIAL (1 badge)
  ('Planner', 'Create your Last Wish settings', '📋', 'rainbow', 'special', '{"action": "create_last_wish", "count": 1}'::jsonb, 1000, true)
) AS new_achievements(name, description, icon, rarity, category, requirements, points, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements a WHERE a.name = new_achievements.name
);

-- Show what we have now
SELECT 'Achievements after comprehensive insert:' as info;
SELECT 
  category,
  COUNT(*) as badge_count,
  STRING_AGG(name, ', ' ORDER BY rarity, name) as badge_names
FROM achievements 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Final summary
SELECT 'Final achievement summary:' as info;
SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN rarity = 'bronze' THEN 1 END) as bronze_badges,
  COUNT(CASE WHEN rarity = 'silver' THEN 1 END) as silver_badges,
  COUNT(CASE WHEN rarity = 'gold' THEN 1 END) as gold_badges,
  COUNT(CASE WHEN rarity = 'diamond' THEN 1 END) as diamond_badges,
  COUNT(CASE WHEN rarity = 'rainbow' THEN 1 END) as rainbow_badges
FROM achievements 
WHERE is_active = true;
