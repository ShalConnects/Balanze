-- Fix DPS Display Issue
-- This script will ensure DPS fields are properly configured and visible

-- 1. First, ensure all DPS fields exist in the accounts table
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

-- 2. Update account_balances view to ensure DPS fields are properly included
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

-- 3. Check current DPS status of all accounts
SELECT 'Current DPS status of all accounts:' as info;
SELECT 
    id,
    name,
    has_dps,
    dps_type,
    dps_amount_type,
    dps_fixed_amount,
    dps_savings_account_id,
    is_active
FROM accounts 
ORDER BY name;

-- 4. Enable DPS on accounts that might need it (example for testing)
-- Uncomment and modify the account name below to enable DPS on a specific account
/*
UPDATE accounts 
SET 
    has_dps = true,
    dps_type = 'monthly',
    dps_amount_type = 'fixed',
    dps_fixed_amount = 100.00
WHERE name = 'Your Account Name'  -- Replace with actual account name
AND has_dps = false;
*/

-- 5. Verify the account_balances view is working correctly
SELECT 'Testing account_balances view:' as info;
SELECT 
    account_id,
    name,
    has_dps,
    dps_type,
    dps_amount_type,
    dps_fixed_amount,
    dps_savings_account_id,
    calculated_balance
FROM account_balances 
ORDER BY name;

-- 6. Show accounts that should display the "Have DPS" tag
SELECT 'Accounts that should show "Have DPS" tag:' as info;
SELECT 
    account_id,
    name,
    has_dps,
    dps_type,
    dps_amount_type,
    dps_fixed_amount
FROM account_balances 
WHERE has_dps = true
ORDER BY name; 