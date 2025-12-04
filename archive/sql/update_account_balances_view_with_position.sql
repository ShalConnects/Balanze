-- =====================================================
-- UPDATE ACCOUNT_BALANCES VIEW TO INCLUDE POSITION FIELD
-- =====================================================

-- Drop the existing view
DROP VIEW IF EXISTS account_balances;

-- Recreate the view with position field included
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
    COALESCE(a.position, 0) as position,
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
    a.description,
    a.position;

-- Verify the view includes the position field
SELECT 'Updated account_balances view columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'account_balances' 
ORDER BY ordinal_position;

-- Test the view with a sample query
SELECT 'Sample account_balances data:' as info;
SELECT account_id, name, position, calculated_balance
FROM account_balances 
LIMIT 5;
