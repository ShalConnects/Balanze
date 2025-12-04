-- Fix account issues: Add updated_at column and update account_balances view
-- Run this in your Supabase SQL Editor

-- 1. Add updated_at column to accounts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'updated_at') THEN
        ALTER TABLE accounts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to accounts table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in accounts table';
    END IF;
END $$;

-- 2. Add DPS fields to accounts table if they don't exist
DO $$
BEGIN
    -- Check if has_dps column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'has_dps') THEN
        ALTER TABLE accounts ADD COLUMN has_dps boolean DEFAULT false;
        RAISE NOTICE 'Added has_dps column';
    END IF;

    -- Check if dps_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_type') THEN
        ALTER TABLE accounts ADD COLUMN dps_type text CHECK (dps_type IN ('monthly', 'flexible') OR dps_type IS NULL);
        RAISE NOTICE 'Added dps_type column';
    END IF;

    -- Check if dps_amount_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_amount_type') THEN
        ALTER TABLE accounts ADD COLUMN dps_amount_type text CHECK (dps_amount_type IN ('fixed', 'custom') OR dps_amount_type IS NULL);
        RAISE NOTICE 'Added dps_amount_type column';
    END IF;

    -- Check if dps_fixed_amount column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_fixed_amount') THEN
        ALTER TABLE accounts ADD COLUMN dps_fixed_amount decimal DEFAULT NULL;
        RAISE NOTICE 'Added dps_fixed_amount column';
    END IF;

    -- Check if dps_savings_account_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_savings_account_id') THEN
        ALTER TABLE accounts ADD COLUMN dps_savings_account_id uuid REFERENCES accounts(id);
        RAISE NOTICE 'Added dps_savings_account_id column';
    END IF;
END $$;

-- 3. Create or replace the function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Create trigger for updated_at on accounts table
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Update account_balances view to handle all possible fields
DROP VIEW IF EXISTS account_balances;

CREATE OR REPLACE VIEW account_balances AS
SELECT 
    a.id as account_id,
    a.user_id,
    a.name,
    a.type,
    a.currency,
    a.is_active,
    a.created_at,
    a.updated_at,
    COALESCE(a.donation_preference, 0) as donation_preference,
    COALESCE(a.initial_balance, 0) as initial_balance,
    COALESCE(a.has_dps, false) as has_dps,
    a.dps_type,
    a.dps_amount_type,
    a.dps_fixed_amount,
    a.dps_savings_account_id,
    COALESCE(a.description, '') as description,
    (COALESCE(a.initial_balance, 0) + COALESCE(
        SUM(
            CASE 
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                ELSE 0
            END
        ),
        0
    )) as calculated_balance
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY 
    a.id, 
    a.user_id, 
    a.name, 
    a.type, 
    a.currency, 
    a.is_active, 
    a.created_at, 
    a.updated_at,
    a.donation_preference,
    a.initial_balance,
    a.has_dps,
    a.dps_type,
    a.dps_amount_type,
    a.dps_fixed_amount,
    a.dps_savings_account_id,
    a.description;

-- 6. Verify the changes
SELECT 'Accounts table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;

SELECT 'Account balances view sample:' as info;
SELECT account_id, name, calculated_balance, has_dps
FROM account_balances 
LIMIT 5;

-- Migration: Enable ON DELETE CASCADE for account deletion
-- This will allow deleting an account and automatically remove all related transfers and DPS transfers

ALTER TABLE dps_transfers
  DROP CONSTRAINT IF EXISTS dps_transfers_from_account_id_fkey,
  DROP CONSTRAINT IF EXISTS dps_transfers_to_account_id_fkey,
  ADD CONSTRAINT dps_transfers_from_account_id_fkey
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  ADD CONSTRAINT dps_transfers_to_account_id_fkey
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE transfers
  DROP CONSTRAINT IF EXISTS transfers_from_account_id_fkey,
  DROP CONSTRAINT IF EXISTS transfers_to_account_id_fkey,
  ADD CONSTRAINT transfers_from_account_id_fkey
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  ADD CONSTRAINT transfers_to_account_id_fkey
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE; 