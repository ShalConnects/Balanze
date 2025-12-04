-- Remove Migration Transactions for Specific User
-- This will delete all LB% transactions created by migration for the specified user

-- Step 1: Show what transactions will be deleted (for verification)
SELECT 
    'TRANSACTIONS_TO_DELETE' as section,
    'Migration transactions for user' as description,
    COUNT(*) as count
FROM transactions 
WHERE transaction_id LIKE 'LB%'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 2: Show sample of transactions to be deleted
SELECT 
    transaction_id,
    description,
    amount,
    type,
    account_id,
    created_at
FROM transactions 
WHERE transaction_id LIKE 'LB%'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53'
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Delete all migration transactions for this user
DELETE FROM transactions 
WHERE transaction_id LIKE 'LB%'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 4: Verify deletion
SELECT 
    'DELETION_VERIFICATION' as section,
    'Remaining LB% transactions for user' as description,
    COUNT(*) as count
FROM transactions 
WHERE transaction_id LIKE 'LB%'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 5: Show total transactions for user after cleanup
SELECT 
    'USER_TRANSACTIONS' as section,
    'Total transactions for user after cleanup' as description,
    COUNT(*) as count
FROM transactions 
WHERE user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 6: Show accounts after transaction removal
SELECT 
    a.name as account_name,
    a.currency
FROM accounts a
WHERE a.user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53'
ORDER BY a.name;
