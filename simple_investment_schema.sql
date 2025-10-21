-- =====================================================
-- SIMPLE INVESTMENT TRACKING SCHEMA
-- =====================================================
-- Simple investment tracking using existing transaction system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- INVESTMENT CATEGORIES TABLE (Simple)
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'TrendingUp',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENT GOALS TABLE (Simple)
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_investment_categories_user_id ON investment_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_goals_user_id ON investment_goals(user_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Investment Categories RLS
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own investment categories" ON investment_categories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own investment categories" ON investment_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investment categories" ON investment_categories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investment categories" ON investment_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Investment Goals RLS
ALTER TABLE investment_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own investment goals" ON investment_goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own investment goals" ON investment_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investment goals" ON investment_goals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investment goals" ON investment_goals
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- INSERT DEFAULT INVESTMENT CATEGORIES
-- =====================================================
INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Stocks',
    'Individual stock investments',
    '#10B981',
    'TrendingUp'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Crypto',
    'Cryptocurrency investments',
    '#F59E0B',
    'Bitcoin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Bonds',
    'Bond investments',
    '#3B82F6',
    'Shield'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Real Estate',
    'Real estate investments',
    '#8B5CF6',
    'Home'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
