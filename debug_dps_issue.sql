-- Debug DPS Issue: Check why "Have DPS" tag isn't showing
-- Run this in your Supabase SQL Editor

-- 1. Check if DPS fields exist in accounts table
SELECT 'Checking DPS fields in accounts table:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name IN ('has_dps', 'dps_type', 'dps_amount_type', 'dps_fixed_amount', 'dps_savings_account_id')
ORDER BY column_name;

-- 2. Check accounts with DPS enabled
SELECT 'Accounts with DPS enabled:' as info;
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
WHERE has_dps = true
ORDER BY name;

-- 3. Check all accounts and their DPS status
SELECT 'All accounts and their DPS status:' as info;
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

-- 4. Check account_balances view structure
SELECT 'Account balances view columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'account_balances' 
AND column_name IN ('has_dps', 'dps_type', 'dps_amount_type', 'dps_fixed_amount', 'dps_savings_account_id')
ORDER BY column_name;

-- 5. Check account_balances view data for DPS accounts
SELECT 'Account balances view - DPS accounts:' as info;
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
WHERE has_dps = true
ORDER BY name;

-- 6. Check if there are any accounts that should have DPS but don't
SELECT 'Accounts that might need DPS but don\'t have it:' as info;
SELECT 
    id,
    name,
    has_dps,
    type,
    description
FROM accounts 
WHERE (name ILIKE '%dps%' OR name ILIKE '%pension%' OR name ILIKE '%retirement%')
AND has_dps = false
ORDER BY name;

-- 7. Test the account_balances view directly
SELECT 'Testing account_balances view directly:' as info;
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
LIMIT 5; 