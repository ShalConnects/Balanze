-- =====================================================
-- INVESTMENT TRACKING DATABASE SCHEMA
-- =====================================================
-- This schema extends the existing Balanze finance app with comprehensive investment tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- INVESTMENT CATEGORIES TABLE
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
-- INVESTMENT ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL, -- e.g., 'AAPL', 'BTC', 'TSLA'
    name TEXT NOT NULL, -- e.g., 'Apple Inc.', 'Bitcoin', 'Tesla Inc.'
    asset_type TEXT CHECK (asset_type IN ('stock', 'bond', 'etf', 'mutual_fund', 'crypto', 'commodity', 'real_estate', 'other')) NOT NULL,
    category_id UUID REFERENCES investment_categories(id) ON DELETE SET NULL,
    current_price DECIMAL(15,4) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    total_shares DECIMAL(15,6) DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    cost_basis DECIMAL(15,2) DEFAULT 0, -- Total amount invested
    unrealized_gain_loss DECIMAL(15,2) DEFAULT 0,
    realized_gain_loss DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES investment_assets(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'split', 'merger', 'transfer_in', 'transfer_out')) NOT NULL,
    quantity DECIMAL(15,6) NOT NULL,
    price_per_share DECIMAL(15,4) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PORTFOLIO PERFORMANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    total_cost_basis DECIMAL(15,2) NOT NULL,
    unrealized_gain_loss DECIMAL(15,2) NOT NULL,
    realized_gain_loss DECIMAL(15,2) NOT NULL,
    total_gain_loss DECIMAL(15,2) NOT NULL,
    return_percentage DECIMAL(8,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENT GOALS TABLE
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
CREATE INDEX IF NOT EXISTS idx_investment_assets_user_id ON investment_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_assets_account_id ON investment_assets(account_id);
CREATE INDEX IF NOT EXISTS idx_investment_assets_symbol ON investment_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_account_id ON investment_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_asset_id ON investment_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_user_id ON portfolio_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_account_id ON portfolio_performance(account_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_date ON portfolio_performance(date);
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

-- Investment Assets RLS
ALTER TABLE investment_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own investment assets" ON investment_assets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own investment assets" ON investment_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investment assets" ON investment_assets
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investment assets" ON investment_assets
    FOR DELETE USING (auth.uid() = user_id);

-- Investment Transactions RLS
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own investment transactions" ON investment_transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own investment transactions" ON investment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investment transactions" ON investment_transactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investment transactions" ON investment_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Portfolio Performance RLS
ALTER TABLE portfolio_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own portfolio performance" ON portfolio_performance
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own portfolio performance" ON portfolio_performance
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio performance" ON portfolio_performance
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolio performance" ON portfolio_performance
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
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update asset totals when transactions change
CREATE OR REPLACE FUNCTION update_asset_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the asset's total shares and cost basis
    UPDATE investment_assets 
    SET 
        total_shares = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'buy' THEN quantity
                    WHEN transaction_type = 'sell' THEN -quantity
                    ELSE 0
                END
            ), 0)
            FROM investment_transactions 
            WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id)
        ),
        cost_basis = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'buy' THEN total_amount
                    WHEN transaction_type = 'sell' THEN -total_amount
                    ELSE 0
                END
            ), 0)
            FROM investment_transactions 
            WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update asset totals
CREATE TRIGGER trigger_update_asset_totals
    AFTER INSERT OR UPDATE OR DELETE ON investment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_totals();

-- Function to update asset values when price changes
CREATE OR REPLACE FUNCTION update_asset_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total value and unrealized gain/loss
    NEW.total_value = NEW.total_shares * NEW.current_price;
    NEW.unrealized_gain_loss = NEW.total_value - NEW.cost_basis;
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update asset values
CREATE TRIGGER trigger_update_asset_values
    BEFORE UPDATE ON investment_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_values();
