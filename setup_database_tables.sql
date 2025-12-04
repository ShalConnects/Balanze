-- =====================================================
-- COMPLETE DATABASE SETUP FOR FINANCE APP
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash')) NOT NULL,
    initial_balance DECIMAL(15,2) DEFAULT 0,
    calculated_balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    has_dps BOOLEAN DEFAULT false,
    dps_type TEXT CHECK (dps_type IN ('monthly', 'flexible')) NULL,
    dps_amount_type TEXT CHECK (dps_amount_type IN ('fixed', 'custom')) NULL,
    dps_fixed_amount DECIMAL(15,2) NULL,
    dps_savings_account_id UUID REFERENCES accounts(id) NULL,
    donation_preference DECIMAL(5,2) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- RLS Policies for accounts
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;
CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    saving_amount DECIMAL(15,2) DEFAULT 0,
    note TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SAVINGS GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE NOT NULL,
    source_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    savings_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_source_account ON savings_goals(source_account_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_savings_account ON savings_goals(savings_account_id);

-- RLS Policies for savings_goals
DROP POLICY IF EXISTS "Users can view their own savings goals" ON savings_goals;
CREATE POLICY "Users can view their own savings goals" ON savings_goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own savings goals" ON savings_goals;
CREATE POLICY "Users can insert their own savings goals" ON savings_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own savings goals" ON savings_goals;
CREATE POLICY "Users can update their own savings goals" ON savings_goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own savings goals" ON savings_goals;
CREATE POLICY "Users can delete their own savings goals" ON savings_goals
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PURCHASE CATEGORIES TABLE (Already created)
-- =====================================================
-- This table should already exist from previous setup
-- Just ensure RLS is enabled and policies are in place

-- RLS Policies for purchase_categories (if not already created)
DROP POLICY IF EXISTS "Users can view their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can view their own purchase categories" ON purchase_categories
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can insert their own purchase categories" ON purchase_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can update their own purchase categories" ON purchase_categories
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can delete their own purchase categories" ON purchase_categories
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PURCHASES TABLE (Already created)
-- =====================================================
-- This table should already exist from previous setup
-- Just ensure RLS is enabled and policies are in place

-- RLS Policies for purchases (if not already created)
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
CREATE POLICY "Users can insert their own purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchases" ON purchases;
CREATE POLICY "Users can update their own purchases" ON purchases
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchases" ON purchases;
CREATE POLICY "Users can delete their own purchases" ON purchases
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_categories_updated_at ON purchase_categories;
CREATE TRIGGER update_purchase_categories_updated_at
    BEFORE UPDATE ON purchase_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('accounts', 'transactions', 'savings_goals', 'purchase_categories', 'purchases')
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'transactions', 'savings_goals', 'purchase_categories', 'purchases')
ORDER BY tablename, policyname; 