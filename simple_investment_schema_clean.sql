-- =====================================================
-- SIMPLE INVESTMENT TRACKING SCHEMA (CLEAN VERSION)
-- =====================================================
-- This handles existing tables and creates a simple investment system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CLEAN UP EXISTING COMPLEX TABLES (OPTIONAL)
-- =====================================================
-- Uncomment these lines if you want to remove the complex tables
-- and start fresh with the simple version

-- DROP TABLE IF EXISTS investment_assets CASCADE;
-- DROP TABLE IF EXISTS investment_transactions CASCADE;
-- DROP TABLE IF EXISTS portfolio_performance CASCADE;

-- =====================================================
-- SIMPLE INVESTMENT CATEGORIES TABLE
-- =====================================================
-- Keep existing table but ensure it has the right structure
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
-- SIMPLE INVESTMENT GOALS TABLE
-- =====================================================
-- Keep existing table but ensure it has the right structure
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
-- ROW LEVEL SECURITY POLICIES (SAFE VERSION)
-- =====================================================

-- Investment Categories RLS (only create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_categories' 
        AND policyname = 'Users can view their own investment categories'
    ) THEN
        ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own investment categories" ON investment_categories
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_categories' 
        AND policyname = 'Users can insert their own investment categories'
    ) THEN
        CREATE POLICY "Users can insert their own investment categories" ON investment_categories
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_categories' 
        AND policyname = 'Users can update their own investment categories'
    ) THEN
        CREATE POLICY "Users can update their own investment categories" ON investment_categories
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_categories' 
        AND policyname = 'Users can delete their own investment categories'
    ) THEN
        CREATE POLICY "Users can delete their own investment categories" ON investment_categories
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Investment Goals RLS (only create if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_goals' 
        AND policyname = 'Users can view their own investment goals'
    ) THEN
        ALTER TABLE investment_goals ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own investment goals" ON investment_goals
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_goals' 
        AND policyname = 'Users can insert their own investment goals'
    ) THEN
        CREATE POLICY "Users can insert their own investment goals" ON investment_goals
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_goals' 
        AND policyname = 'Users can update their own investment goals'
    ) THEN
        CREATE POLICY "Users can update their own investment goals" ON investment_goals
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investment_goals' 
        AND policyname = 'Users can delete their own investment goals'
    ) THEN
        CREATE POLICY "Users can delete their own investment goals" ON investment_goals
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- INSERT DEFAULT INVESTMENT CATEGORIES (SAFE VERSION)
-- =====================================================
-- Only insert if they don't already exist
INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Stocks',
    'Individual stock investments',
    '#10B981',
    'TrendingUp'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM investment_categories 
    WHERE user_id = auth.uid() AND name = 'Stocks'
);

INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Crypto',
    'Cryptocurrency investments',
    '#F59E0B',
    'Bitcoin'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM investment_categories 
    WHERE user_id = auth.uid() AND name = 'Crypto'
);

INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Bonds',
    'Bond investments',
    '#3B82F6',
    'Shield'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM investment_categories 
    WHERE user_id = auth.uid() AND name = 'Bonds'
);

INSERT INTO investment_categories (user_id, name, description, color, icon) 
SELECT 
    auth.uid(),
    'Real Estate',
    'Real estate investments',
    '#8B5CF6',
    'Home'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM investment_categories 
    WHERE user_id = auth.uid() AND name = 'Real Estate'
);

-- =====================================================
-- ADD INVESTMENT CATEGORIES TO EXISTING TRANSACTIONS
-- =====================================================
-- This adds investment categories to your existing categories table
-- so you can use them in your existing transaction system
-- Note: This will create categories for each user when they first access the system

-- Create a function to add investment categories for a specific user
CREATE OR REPLACE FUNCTION add_investment_categories_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Add investment expense categories
    INSERT INTO categories (user_id, name, type, color, icon, currency)
    VALUES 
        (user_uuid, 'Stock Purchase', 'expense', '#10B981', 'TrendingUp', 'USD'),
        (user_uuid, 'Crypto Investment', 'expense', '#F59E0B', 'Bitcoin', 'USD'),
        (user_uuid, 'Bond Investment', 'expense', '#3B82F6', 'Shield', 'USD'),
        (user_uuid, 'Real Estate Investment', 'expense', '#8B5CF6', 'Home', 'USD'),
        (user_uuid, 'ETF Investment', 'expense', '#8B5CF6', 'BarChart3', 'USD'),
        (user_uuid, 'Mutual Fund Investment', 'expense', '#6366F1', 'PieChart', 'USD')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    -- Add investment income categories
    INSERT INTO categories (user_id, name, type, color, icon, currency)
    VALUES 
        (user_uuid, 'Dividend Income', 'income', '#10B981', 'TrendingUp', 'USD'),
        (user_uuid, 'Investment Sale', 'income', '#059669', 'TrendingDown', 'USD'),
        (user_uuid, 'Capital Gains', 'income', '#059669', 'TrendingUp', 'USD'),
        (user_uuid, 'Interest Income', 'income', '#3B82F6', 'DollarSign', 'USD')
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SIMPLE INVESTMENT HELPER FUNCTIONS
-- =====================================================

-- Function to get investment transactions for a user
CREATE OR REPLACE FUNCTION get_investment_transactions(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    account_id UUID,
    type TEXT,
    amount DECIMAL,
    description TEXT,
    category TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.account_id,
        t.type,
        t.amount,
        t.description,
        t.category,
        t.date,
        t.created_at
    FROM transactions t
    WHERE t.user_id = user_uuid
    AND t.category IN (
        'Stock Purchase', 'Crypto Investment', 'Bond Investment', 
        'Real Estate Investment', 'ETF Investment', 'Mutual Fund Investment',
        'Dividend Income', 'Investment Sale', 'Capital Gains', 'Interest Income'
    )
    ORDER BY t.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get investment stats for a user
CREATE OR REPLACE FUNCTION get_investment_stats(user_uuid UUID)
RETURNS TABLE (
    total_investment_value DECIMAL,
    total_goals INTEGER,
    active_goals INTEGER,
    completed_goals INTEGER,
    total_goal_progress DECIMAL
) AS $$
DECLARE
    investment_total DECIMAL := 0;
    goals_count INTEGER := 0;
    active_count INTEGER := 0;
    completed_count INTEGER := 0;
    progress_total DECIMAL := 0;
BEGIN
    -- Calculate total investment value from transactions
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount
            WHEN type = 'expense' THEN -amount
            ELSE 0
        END
    ), 0) INTO investment_total
    FROM transactions t
    WHERE t.user_id = user_uuid
    AND t.category IN (
        'Stock Purchase', 'Crypto Investment', 'Bond Investment', 
        'Real Estate Investment', 'ETF Investment', 'Mutual Fund Investment',
        'Dividend Income', 'Investment Sale', 'Capital Gains', 'Interest Income'
    );
    
    -- Get goal statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COALESCE(SUM(current_amount), 0)
    INTO goals_count, active_count, completed_count, progress_total
    FROM investment_goals
    WHERE user_id = user_uuid;
    
    RETURN QUERY SELECT 
        investment_total,
        goals_count,
        active_count,
        completed_count,
        progress_total;
END;
$$ LANGUAGE plpgsql;
