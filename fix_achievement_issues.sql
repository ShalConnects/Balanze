-- Fix Achievement Issues
-- This script will help resolve common issues with achievements

-- 1. Remove duplicate achievements (keep the first one)
WITH duplicates AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
  FROM achievements 
  WHERE is_active = true
)
DELETE FROM achievements 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Ensure all achievements have proper categories
UPDATE achievements 
SET category = CASE 
  WHEN name IN ('First Account', 'First Transaction', 'Organizer', 'Goal Setter') THEN 'getting_started'
  WHEN name IN ('Daily Tracker', 'Transaction Master', 'Consistent Logger', 'Data Enthusiast') THEN 'financial_tracking'
  WHEN name IN ('Multi-Account', 'Multi-Currency', 'Account Master') THEN 'account_management'
  WHEN name IN ('Savings Starter', 'Goal Crusher', 'Savings Champion') THEN 'savings_goals'
  WHEN name IN ('Lender', 'Borrower', 'Settlement Master') THEN 'lend_borrow'
  WHEN name IN ('Purchase Tracker', 'Document Keeper') THEN 'purchase_tracking'
  WHEN name IN ('Investor', 'Portfolio Manager') THEN 'investment'
  WHEN name IN ('Data Explorer', 'Insight Seeker') THEN 'analytics'
  WHEN name IN ('Philanthropist', 'Generous Heart') THEN 'donations'
  WHEN name IN ('Daily User', 'Loyal User', 'Power User') THEN 'consistency'
  WHEN name IN ('Premium Explorer', 'Premium Power User') THEN 'premium_features'
  WHEN name IN ('Planner') THEN 'special'
  ELSE category
END
WHERE is_active = true;

-- 3. Create missing achievements if needed
INSERT INTO achievements (name, description, icon, rarity, category, requirements, points, is_active)
SELECT * FROM (VALUES
  -- Getting Started (4 badges)
  ('First Account', 'Create your first account', '🏦', 'bronze', 'getting_started', '{"action": "create_account", "count": 1}'::jsonb, 10, true),
  ('First Transaction', 'Record your first transaction', '💰', 'bronze', 'getting_started', '{"action": "create_transaction", "count": 1}'::jsonb, 10, true),
  ('Organizer', 'Create your first category', '📁', 'bronze', 'getting_started', '{"action": "create_category", "count": 1}'::jsonb, 10, true),
  ('Goal Setter', 'Create your first savings goal', '🎯', 'bronze', 'getting_started', '{"action": "create_savings_goal", "count": 1}'::jsonb, 20, true),
  
  -- Financial Tracking (4 badges)
  ('Daily Tracker', 'Log activity for 7 consecutive days', '🗓️', 'silver', 'financial_tracking', '{"action": "daily_tracking", "streak": 7}'::jsonb, 50, true),
  ('Transaction Master', 'Record 10 transactions', '📊', 'silver', 'financial_tracking', '{"action": "create_transaction", "count": 10}'::jsonb, 50, true),
  ('Consistent Logger', 'Log activity for 30 consecutive days', '📈', 'gold', 'financial_tracking', '{"action": "daily_tracking", "streak": 30}'::jsonb, 150, true),
  ('Data Enthusiast', 'Record 100 transactions', '📈', 'gold', 'financial_tracking', '{"action": "create_transaction", "count": 100}'::jsonb, 200, true),
  
  -- Account Management (3 badges)
  ('Multi-Account', 'Create 3 or more accounts', '💳', 'silver', 'account_management', '{"action": "create_account", "count": 3}'::jsonb, 40, true),
  ('Multi-Currency', 'Use 2 different currencies', '🌍', 'silver', 'account_management', '{"action": "multi_currency", "currencies": 2}'::jsonb, 40, true),
  ('Account Master', 'Create 5 or more accounts', '🏦', 'gold', 'account_management', '{"action": "create_account", "count": 5}'::jsonb, 100, true),
  
  -- Savings & Goals (3 badges)
  ('Savings Starter', 'Save $100 or more', '💰', 'silver', 'savings_goals', '{"action": "savings_amount", "amount": 100}'::jsonb, 30, true),
  ('Goal Crusher', 'Complete your first savings goal', '🏆', 'gold', 'savings_goals', '{"action": "complete_goal", "count": 1}'::jsonb, 100, true),
  ('Savings Champion', 'Save $1000 or more', '💎', 'diamond', 'savings_goals', '{"action": "savings_amount", "amount": 1000}'::jsonb, 200, true),
  
  -- Lend & Borrow (3 badges)
  ('Lender', 'Lend money to someone', '🤝', 'silver', 'lend_borrow', '{"action": "create_lend_record", "count": 1}'::jsonb, 30, true),
  ('Borrower', 'Borrow money from someone', '📝', 'silver', 'lend_borrow', '{"action": "create_borrow_record", "count": 1}'::jsonb, 30, true),
  ('Settlement Master', 'Settle 3 loans', '✅', 'gold', 'lend_borrow', '{"action": "settle_loan", "count": 3}'::jsonb, 120, true),
  
  -- Purchase Tracking (2 badges)
  ('Purchase Tracker', 'Record your first purchase', '🛒', 'silver', 'purchase_tracking', '{"action": "create_purchase", "count": 1}'::jsonb, 20, true),
  ('Document Keeper', 'Upload 3 attachments to purchases', '📎', 'gold', 'purchase_tracking', '{"action": "upload_attachment", "count": 3}'::jsonb, 80, true),
  
  -- Investment (2 badges)
  ('Investor', 'Create your first investment asset', '📈', 'silver', 'investment', '{"action": "create_investment", "count": 1}'::jsonb, 50, true),
  ('Portfolio Manager', 'Create 3 investment assets', '💼', 'gold', 'investment', '{"action": "create_investment", "count": 3}'::jsonb, 150, true),
  
  -- Analytics (2 badges)
  ('Data Explorer', 'View analytics page 5 times', '🔍', 'silver', 'analytics', '{"action": "view_analytics", "count": 5}'::jsonb, 40, true),
  ('Insight Seeker', 'View analytics page 15 times', '🧠', 'gold', 'analytics', '{"action": "view_analytics", "count": 15}'::jsonb, 100, true),
  
  -- Donations (2 badges)
  ('Philanthropist', 'Make your first donation', '❤️', 'gold', 'donations', '{"action": "create_donation", "count": 1}'::jsonb, 100, true),
  ('Generous Heart', 'Donate $500 or more', '💖', 'diamond', 'donations', '{"action": "donation_total", "amount": 500}'::jsonb, 250, true),
  
  -- Consistency (3 badges)
  ('Daily User', 'Log in for 3 consecutive days', '🌟', 'silver', 'consistency', '{"action": "daily_login", "streak": 3}'::jsonb, 60, true),
  ('Loyal User', 'Log in for 7 consecutive days', '✨', 'gold', 'consistency', '{"action": "daily_login", "streak": 7}'::jsonb, 180, true),
  ('Power User', 'Log in for 30 consecutive days', '🚀', 'diamond', 'consistency', '{"action": "daily_login", "streak": 30}'::jsonb, 300, true),
  
  -- Premium Features (2 badges)
  ('Premium Explorer', 'Use a premium feature for the first time', '👑', 'gold', 'premium_features', '{"action": "use_premium_feature", "count": 1}'::jsonb, 150, true),
  ('Premium Power User', 'Use 3 different premium features', '🌟', 'diamond', 'premium_features', '{"action": "use_premium_feature", "count": 3}'::jsonb, 350, true),
  
  -- Special (1 badge)
  ('Planner', 'Create your Last Wish', '📜', 'rainbow', 'special', '{"action": "create_last_wish", "count": 1}'::jsonb, 500, true)
) AS new_achievements(name, description, icon, rarity, category, requirements, points, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements a WHERE a.name = new_achievements.name
);

-- 4. Final count check
SELECT 
  'Final Count' as status,
  COUNT(*) as total_achievements
FROM achievements 
WHERE is_active = true;
