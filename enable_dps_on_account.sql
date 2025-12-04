-- Enable DPS on an existing account for testing
-- Replace 'Your Account Name' with the actual account name you want to enable DPS on

-- First, let's see what accounts exist
SELECT 'Available accounts:' as info;
SELECT id, name, has_dps, type, currency FROM accounts ORDER BY name;

-- Enable DPS on a specific account (replace 'Your Account Name' with actual name)
UPDATE accounts 
SET 
    has_dps = true,
    dps_type = 'monthly',
    dps_amount_type = 'fixed',
    dps_fixed_amount = 100.00
WHERE name = 'Your Account Name'  -- Replace with actual account name
AND has_dps = false;

-- Verify the update
SELECT 'Updated account:' as info;
SELECT 
    id, 
    name, 
    has_dps, 
    dps_type, 
    dps_amount_type, 
    dps_fixed_amount,
    dps_savings_account_id
FROM accounts 
WHERE name = 'Your Account Name';  -- Replace with actual account name

-- Check account_balances view for the updated account
SELECT 'Account balances view for updated account:' as info;
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
WHERE name = 'Your Account Name';  -- Replace with actual account name 