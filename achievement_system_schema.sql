-- Achievement System Database Schema
-- This file creates the necessary tables for the achievement badge system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('bronze', 'silver', 'gold', 'diamond', 'rainbow')),
  category VARCHAR(50) NOT NULL,
  requirements JSONB NOT NULL, -- flexible requirements structure
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (earned badges)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress JSONB, -- for progress tracking
  UNIQUE(user_id, achievement_id)
);

-- Achievement progress tracking (for badges not yet earned)
CREATE TABLE IF NOT EXISTS achievement_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress_data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id ON achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_achievement_id ON achievement_progress(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial achievement definitions
INSERT INTO achievements (name, description, icon, rarity, category, requirements, points) VALUES
-- Getting Started Badges
('First Steps', 'Create your first account', '🚀', 'bronze', 'getting_started', '{"action": "create_account", "count": 1}', 10),
('Transaction Tracker', 'Add your first transaction', '📊', 'bronze', 'getting_started', '{"action": "create_transaction", "count": 1}', 10),
('Category Creator', 'Create your first expense category', '🏷️', 'bronze', 'getting_started', '{"action": "create_category", "count": 1}', 10),
('Goal Setter', 'Set your first savings goal', '🎯', 'bronze', 'getting_started', '{"action": "create_savings_goal", "count": 1}', 15),

-- Financial Tracking Badges
('Daily Tracker', 'Track expenses for 7 consecutive days', '📅', 'silver', 'tracking', '{"action": "daily_tracking", "streak": 7}', 25),
('Weekly Warrior', 'Track expenses for 30 consecutive days', '⚔️', 'gold', 'tracking', '{"action": "daily_tracking", "streak": 30}', 50),
('Transaction Titan', 'Add 100 transactions', '💪', 'silver', 'tracking', '{"action": "create_transaction", "count": 100}', 30),
('Data Entry Expert', 'Add 500 transactions', '⌨️', 'gold', 'tracking', '{"action": "create_transaction", "count": 500}', 75),

-- Account Management Badges
('Multi-Account Manager', 'Create 3 different account types', '🏦', 'silver', 'accounts', '{"action": "create_account", "unique_types": 3}', 25),
('Currency Explorer', 'Use multiple currencies', '🌍', 'silver', 'accounts', '{"action": "multi_currency", "currencies": 2}', 20),
('Account Organizer', 'Create 5+ accounts', '📁', 'gold', 'accounts', '{"action": "create_account", "count": 5}', 40),

-- Savings & Goals Badges
('Saver Starter', 'Save your first $100', '🐷', 'bronze', 'savings', '{"action": "savings_amount", "amount": 100}', 20),
('Goal Crusher', 'Complete your first savings goal', '🎯', 'silver', 'savings', '{"action": "complete_goal", "count": 1}', 30),
('Big Saver', 'Save $1000+ in a single goal', '💎', 'gold', 'savings', '{"action": "savings_amount", "amount": 1000}', 100),

-- Lend & Borrow Badges
('Lending Helper', 'Record your first loan', '🤝', 'bronze', 'lend_borrow', '{"action": "create_lend_record", "count": 1}', 15),
('Borrowing Boss', 'Record your first borrowing', '💼', 'bronze', 'lend_borrow', '{"action": "create_borrow_record", "count": 1}', 15),
('Settlement Specialist', 'Settle your first loan', '✅', 'silver', 'lend_borrow', '{"action": "settle_loan", "count": 1}', 25),

-- Purchase Tracking Badges
('Purchase Tracker', 'Track your first purchase', '🛒', 'bronze', 'purchases', '{"action": "create_purchase", "count": 1}', 10),
('Receipt Keeper', 'Upload 10 receipt attachments', '🧾', 'silver', 'purchases', '{"action": "upload_attachment", "count": 10}', 30),

-- Investment Badges
('Investment Newbie', 'Add your first investment', '📈', 'bronze', 'investments', '{"action": "create_investment", "count": 1}', 15),
('Portfolio Builder', 'Create 5 different investments', '🏗️', 'silver', 'investments', '{"action": "create_investment", "count": 5}', 40),

-- Analytics Badges
('Data Explorer', 'View analytics for the first time', '🔍', 'bronze', 'analytics', '{"action": "view_analytics", "count": 1}', 10),
('Chart Master', 'View 10 different analytics reports', '📊', 'silver', 'analytics', '{"action": "view_analytics", "count": 10}', 30),

-- Donation Badges
('Giving Heart', 'Record your first donation', '❤️', 'bronze', 'donations', '{"action": "create_donation", "count": 1}', 15),
('Charity Champion', 'Donate $500+ total', '🏆', 'gold', 'donations', '{"action": "donation_total", "amount": 500}', 75),

-- Consistency Badges
('Daily User', 'Use the app for 7 consecutive days', '📅', 'silver', 'consistency', '{"action": "daily_login", "streak": 7}', 25),
('Weekly Regular', 'Use the app for 30 consecutive days', '📆', 'gold', 'consistency', '{"action": "daily_login", "streak": 30}', 50),
('Monthly Master', 'Use the app for 90 consecutive days', '🗓️', 'diamond', 'consistency', '{"action": "daily_login", "streak": 90}', 100),

-- Premium Feature Badges
('Premium Explorer', 'Use your first premium feature', '⭐', 'silver', 'premium', '{"action": "use_premium_feature", "count": 1}', 30),
('Last Wish Creator', 'Set up your first Last Wish', '💝', 'gold', 'premium', '{"action": "create_last_wish", "count": 1}', 50);

-- Create a view for user achievement summary
CREATE OR REPLACE VIEW user_achievement_summary AS
SELECT 
    ua.user_id,
    COUNT(ua.id) as total_achievements,
    COUNT(CASE WHEN a.rarity = 'bronze' THEN 1 END) as bronze_badges,
    COUNT(CASE WHEN a.rarity = 'silver' THEN 1 END) as silver_badges,
    COUNT(CASE WHEN a.rarity = 'gold' THEN 1 END) as gold_badges,
    COUNT(CASE WHEN a.rarity = 'diamond' THEN 1 END) as diamond_badges,
    COUNT(CASE WHEN a.rarity = 'rainbow' THEN 1 END) as rainbow_badges,
    SUM(a.points) as total_points,
    MAX(ua.earned_at) as last_achievement_earned
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE a.is_active = true
GROUP BY ua.user_id;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON achievement_progress TO authenticated;
GRANT SELECT ON user_achievement_summary TO authenticated;
