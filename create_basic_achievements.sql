-- Create basic achievements if they don't exist
-- This ensures we have the achievements needed for the system

-- Check if achievements exist
SELECT 'Checking existing achievements...' as status;
SELECT COUNT(*) as existing_achievements FROM achievements;

-- Insert basic achievements if they don't exist
INSERT INTO achievements (name, description, icon, rarity, category, requirements, points, is_active)
SELECT * FROM (VALUES
  ('First Account', 'Create your first account', '🏦', 'bronze', 'account', '{"action": "create_account", "count": 1}'::jsonb, 10, true),
  ('First Transaction', 'Record your first transaction', '💰', 'bronze', 'transaction', '{"action": "create_transaction", "count": 1}'::jsonb, 10, true),
  ('Transaction Master', 'Record 10 transactions', '📊', 'silver', 'transaction', '{"action": "create_transaction", "count": 10}'::jsonb, 50, true),
  ('Organizer', 'Create your first category', '📁', 'bronze', 'category', '{"action": "create_category", "count": 1}'::jsonb, 10, true),
  ('Goal Setter', 'Create your first savings goal', '🎯', 'bronze', 'savings', '{"action": "create_savings_goal", "count": 1}'::jsonb, 20, true),
  ('Lender', 'Lend money to someone', '🤝', 'silver', 'lend_borrow', '{"action": "create_lend_record", "count": 1}'::jsonb, 30, true),
  ('Borrower', 'Borrow money from someone', '📝', 'silver', 'lend_borrow', '{"action": "create_borrow_record", "count": 1}'::jsonb, 30, true),
  ('Philanthropist', 'Make your first donation', '❤️', 'gold', 'donation', '{"action": "create_donation", "count": 1}'::jsonb, 100, true),
  ('Multi-Currency', 'Use 2 different currencies', '🌍', 'silver', 'account', '{"action": "multi_currency", "currencies": 2}'::jsonb, 40, true),
  ('Savings Champion', 'Save $1000 or more', '💎', 'gold', 'savings', '{"action": "savings_amount", "amount": 1000}'::jsonb, 200, true)
) AS new_achievements(name, description, icon, rarity, category, requirements, points, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements a WHERE a.name = new_achievements.name
);

-- Show what we have now
SELECT 'Achievements after insert:' as status;
SELECT name, rarity, category FROM achievements ORDER BY name;

-- Count achievements by rarity
SELECT 'Achievement summary:' as status;
SELECT 
  rarity,
  COUNT(*) as count
FROM achievements 
WHERE is_active = true
GROUP BY rarity
ORDER BY 
  CASE rarity 
    WHEN 'bronze' THEN 1 
    WHEN 'silver' THEN 2 
    WHEN 'gold' THEN 3 
    WHEN 'diamond' THEN 4 
    WHEN 'rainbow' THEN 5 
  END;
