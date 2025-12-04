-- Complete database fix for savings goals and accounts
-- This addresses both the user_id and balance column issues

-- =====================================================
-- 1. FIX ACCOUNTS TABLE - Add balance column
-- =====================================================

-- Add balance column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;

-- Update existing records to use calculated_balance as balance
UPDATE accounts 
SET balance = COALESCE(calculated_balance, initial_balance, 0)
WHERE balance = 0;

-- Create a trigger to keep balance in sync with calculated_balance
CREATE OR REPLACE FUNCTION update_accounts_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- If calculated_balance is updated, sync it to balance
    IF TG_OP = 'UPDATE' AND NEW.calculated_balance IS DISTINCT FROM OLD.calculated_balance THEN
        NEW.balance = NEW.calculated_balance;
    END IF;
    
    -- If balance is updated, sync it to calculated_balance
    IF TG_OP = 'UPDATE' AND NEW.balance IS DISTINCT FROM OLD.balance THEN
        NEW.calculated_balance = NEW.balance;
    END IF;
    
    -- For new records, set balance from calculated_balance
    IF TG_OP = 'INSERT' THEN
        NEW.balance = COALESCE(NEW.calculated_balance, NEW.initial_balance, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_accounts_balance_trigger ON accounts;

-- Create the trigger
CREATE TRIGGER update_accounts_balance_trigger
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_accounts_balance();

-- =====================================================
-- 2. FIX SAVINGS_GOALS TABLE - Add missing columns
-- =====================================================

-- Add target_date column
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Add user_id column for easier querying
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to have user_id based on source_account_id
UPDATE savings_goals 
SET user_id = (
  SELECT user_id 
  FROM accounts 
  WHERE accounts.id = savings_goals.source_account_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after populating existing records
ALTER TABLE savings_goals 
ALTER COLUMN user_id SET NOT NULL;

-- Add updated_at column
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_savings_goals_updated_at();

-- =====================================================
-- 3. UPDATE RLS POLICIES
-- =====================================================

-- Update RLS policies to use user_id directly
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
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);
CREATE INDEX IF NOT EXISTS idx_accounts_balance ON accounts(balance);

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify the fixes
SELECT 'ACCOUNTS TABLE FIXED' as status, 
       COUNT(*) as total_accounts,
       COUNT(CASE WHEN balance IS NOT NULL THEN 1 END) as accounts_with_balance
FROM accounts;

SELECT 'SAVINGS_GOALS TABLE FIXED' as status,
       COUNT(*) as total_goals,
       COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as goals_with_user_id,
       COUNT(CASE WHEN target_date IS NOT NULL THEN 1 END) as goals_with_target_date
FROM savings_goals;
