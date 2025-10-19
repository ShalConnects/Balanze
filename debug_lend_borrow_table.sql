-- DEBUG LEND_BORROW TABLE
-- Run this to check the current state of the lend_borrow table

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
ORDER BY ordinal_position;

-- Check current records
SELECT 
    id,
    user_id,
    type,
    person_name,
    amount,
    currency,
    account_id,
    affect_account_balance,
    transaction_id,
    status,
    created_at
FROM lend_borrow 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any records with account_id
SELECT 
    COUNT(*) as total_records,
    COUNT(account_id) as records_with_accounts,
    COUNT(CASE WHEN affect_account_balance = true THEN 1 END) as records_affecting_balance,
    COUNT(CASE WHEN affect_account_balance = false THEN 1 END) as standalone_records
FROM lend_borrow;

-- Check recent transactions
SELECT 
    id,
    account_id,
    amount,
    type,
    description,
    tags,
    created_at
FROM transactions 
WHERE 'lend_borrow' = ANY(tags)
ORDER BY created_at DESC 
LIMIT 10;
