-- Rollback Migration Using Existing Backup
-- This will restore the original state using the backup table created during migration

-- Step 1: Check what backup tables exist
SELECT 
    'BACKUP_TABLES' as section,
    'Available backup tables' as description,
    table_name as table_name
FROM information_schema.tables 
WHERE table_name LIKE '%backup%' 
OR table_name LIKE '%lend_borrow%'
ORDER BY table_name;

-- Step 2: Show backup table contents (if exists)
SELECT 
    'BACKUP_CONTENTS' as section,
    'Records in backup table' as description,
    COUNT(*) as count
FROM lend_borrow_backup
WHERE lend_borrow_backup IS NOT NULL;

-- Step 3: Delete all migration-created transactions
DELETE FROM transactions 
WHERE transaction_id LIKE 'LB%' 
AND transaction_id IN (
    SELECT transaction_id FROM lend_borrow 
    WHERE transaction_id IS NOT NULL
);

-- Step 4: Restore original lend_borrow records from backup
-- First, delete current migrated records
DELETE FROM lend_borrow 
WHERE account_id IS NOT NULL 
AND transaction_id IS NOT NULL;

-- Then restore from backup
INSERT INTO lend_borrow (
    id, type, person_name, amount, currency, due_date, notes, 
    status, partial_return_amount, partial_return_date, 
    account_id, affect_account_balance, user_id, created_at, updated_at
)
SELECT 
    id, type, person_name, amount, currency, due_date, notes, 
    status, partial_return_amount, partial_return_date, 
    account_id, affect_account_balance, user_id, created_at, updated_at
FROM lend_borrow_backup;

-- Step 5: Verify rollback
SELECT 
    'ROLLBACK_VERIFICATION' as section,
    'Records restored from backup' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE account_id IS NOT NULL 
AND transaction_id IS NULL;

SELECT 
    'ROLLBACK_VERIFICATION' as section,
    'Migration transactions removed' as description,
    COUNT(*) as count
FROM transactions 
WHERE transaction_id LIKE 'LB%';

-- Step 6: Show sample of restored records
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
