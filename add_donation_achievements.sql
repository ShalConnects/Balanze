-- Add additional donation-specific achievements to the database
-- Note: Some achievements like "Philanthropist" and "Generous Heart" already exist
-- This adds complementary donation achievements that don't conflict

INSERT INTO achievements (name, description, icon, rarity, category, requirements, points, is_active) VALUES

-- Regular donor achievement (complement to existing "Philanthropist")
('Regular Donor', 'Make 5 donations', '💝', 'silver', 'donations',
 '{"action": "donation", "count": 5}', 25, true),

-- Monthly hero achievement
('Monthly Hero', 'Make 2+ donations in a single month', '📅', 'silver', 'donations',
 '{"action": "donation_monthly", "count": 2}', 30, true),

-- Consistent giver achievement
('Consistent Giver', 'Donate for 3 consecutive months', '🔄', 'gold', 'donations',
 '{"action": "donation_streak", "months": 3}', 75, true),

-- Big spender achievement (different from existing "Generous Heart" which is $500+)
('Big Spender', 'Make a single donation of $1000+', '💎', 'diamond', 'donations',
 '{"action": "donation_single", "amount": 1000}', 100, true),

-- Charity champion achievement
('Charity Champion', 'Make 20+ total donations', '🏆', 'diamond', 'donations',
 '{"action": "donation", "count": 20}', 150, true),

-- Quick giver achievement
('Quick Giver', 'Make 3 donations in one week', '⚡', 'silver', 'donations',
 '{"action": "donation_weekly", "count": 3}', 40, true),

-- Donation streak achievement
('Donation Streak', 'Donate for 7 consecutive days', '🔥', 'gold', 'donations',
 '{"action": "donation_daily_streak", "days": 7}', 60, true),

-- Small but mighty achievement
('Small but Mighty', 'Make 10 donations under $10 each', '⭐', 'silver', 'donations',
 '{"action": "donation_small", "count": 10, "max_amount": 10}', 35, true);
