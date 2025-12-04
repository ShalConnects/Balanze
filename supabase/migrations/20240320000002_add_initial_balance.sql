-- Drop the view first
DROP VIEW IF EXISTS account_balances;

-- Add initial_balance column to accounts table
ALTER TABLE accounts ADD COLUMN initial_balance DECIMAL(12,2) DEFAULT 0;

-- Migrate existing balance data to initial_balance
UPDATE accounts SET initial_balance = balance;

-- Make initial_balance NOT NULL after migration
ALTER TABLE accounts ALTER COLUMN initial_balance SET NOT NULL;

-- Drop the old balance column since we're now using the view
ALTER TABLE accounts DROP COLUMN balance;

-- Recreate the view
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    a.id as account_id,
    a.user_id,
    a.name,
    a.type,
    a.currency,
    a.is_active,
    a.created_at,
    a.donation_preference,
    a.initial_balance,
    (a.initial_balance + COALESCE(
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
GROUP BY a.id, a.user_id, a.name, a.type, a.currency, a.is_active, a.created_at, a.donation_preference, a.initial_balance; 