-- Complete Rollback of Migration
-- This will remove all migration changes and restore original state

-- Step 1: Delete all created transactions from migration
DELETE FROM transactions 
WHERE transaction_id LIKE 'LB%' 
AND transaction_id IN (
    SELECT transaction_id FROM lend_borrow 
    WHERE transaction_id IS NOT NULL
);

-- Step 2: Remove transaction_id from lend_borrow records
UPDATE lend_borrow 
SET 
    transaction_id = NULL,
    affect_account_balance = true  -- Restore original behavior
WHERE 
    transaction_id IS NOT NULL;

-- Step 3: Verify rollback
SELECT 
    'ROLLBACK_SUMMARY' as section,
    'Records with transaction_id' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE transaction_id IS NOT NULL;

SELECT 
    'ROLLBACK_SUMMARY' as section,
    'Transactions created by migration' as description,
    COUNT(*) as count
FROM transactions 
WHERE transaction_id LIKE 'LB%';

-- Step 4: Show current state
SELECT 
    id,
    type,
    person_name,
    amount,
    currency,
    status,
    affect_account_balance,
    account_id,
    transaction_id
FROM lend_borrow 
WHERE account_id IS NOT NULL
LIMIT 5;
