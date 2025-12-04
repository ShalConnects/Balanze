-- Update account_balances view to include DPS fields
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
    a.donation_preference,
    a.initial_balance,
    a.has_dps,
    a.dps_type,
    a.dps_amount_type,
    a.dps_fixed_amount,
    a.dps_savings_account_id,
    a.description,
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
GROUP BY a.id, a.user_id, a.name, a.type, a.currency, a.is_active, a.created_at, a.donation_preference, a.initial_balance, a.has_dps, a.dps_type, a.dps_amount_type, a.dps_fixed_amount, a.dps_savings_account_id, a.description; 