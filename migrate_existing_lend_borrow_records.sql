-- Migration Script for Existing Lend & Borrow Records
-- This script migrates existing account-linked records that lack transaction_id

-- Step 1: Create a backup table before migration
CREATE TABLE IF NOT EXISTS lend_borrow_backup AS 
SELECT * FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NULL;

-- Step 2: Generate transaction_ids for records that need migration
-- and create corresponding transactions
DO $$
DECLARE
    record_record RECORD;
    new_transaction_id TEXT;
    transaction_type TEXT;
    transaction_description TEXT;
BEGIN
    -- Loop through all records that need migration
    FOR record_record IN 
        SELECT id, user_id, type, person_name, amount, currency, account_id, created_at
        FROM lend_borrow 
        WHERE account_id IS NOT NULL AND transaction_id IS NULL
    LOOP
        -- Generate unique transaction_id
        new_transaction_id := 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Determine transaction type and description
        IF record_record.type = 'lend' THEN
            transaction_type := 'expense';  -- We lent money (expense)
            transaction_description := 'Lent to ' || record_record.person_name;
        ELSE
            transaction_type := 'income';  -- We borrowed money (income)
            transaction_description := 'Borrowed from ' || record_record.person_name;
        END IF;
        
        -- Create the transaction record
        INSERT INTO transactions (
            user_id,
            account_id,
            type,
            amount,
            description,
            category,
            date,
            tags,
            transaction_id,
            created_at,
            updated_at
        ) VALUES (
            record_record.user_id,
            record_record.account_id,
            transaction_type,
            record_record.amount,
            transaction_description,
            'Lend/Borrow',
            record_record.created_at::DATE,
            ARRAY['lend_borrow', 'loan', 'migrated'],
            new_transaction_id,
            record_record.created_at,
            NOW()
        );
        
        -- Update the lend_borrow record with the transaction_id
        UPDATE lend_borrow 
        SET 
            transaction_id = new_transaction_id,
            updated_at = NOW()
        WHERE id = record_record.id;
        
        -- Log the migration
        RAISE NOTICE 'Migrated record %: % % to % (Transaction ID: %)', 
            record_record.id, 
            record_record.type, 
            record_record.person_name,
            record_record.amount,
            new_transaction_id;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Step 3: Verify the migration
SELECT 
    'MIGRATION_VERIFICATION' as check_type,
    COUNT(*) as migrated_records,
    'Records successfully migrated' as description
FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NOT NULL;

-- Step 4: Check for any remaining unmigrated records
SELECT 
    'REMAINING_UNMIGRATED' as check_type,
    COUNT(*) as count,
    'Records still needing migration' as description
FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NULL;

-- Step 5: Verify transaction creation
SELECT 
    'TRANSACTION_VERIFICATION' as check_type,
    COUNT(*) as created_transactions,
    'Transactions created during migration' as description
FROM transactions 
WHERE tags @> ARRAY['migrated'] AND category = 'Lend/Borrow';

-- Step 6: Check account balance consistency
-- This query will help verify that account balances are consistent
SELECT 
    a.id as account_id,
    a.name as account_name,
    a.calculated_balance as current_balance,
    COALESCE(SUM(
        CASE 
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
        END
    ), 0) as calculated_balance_from_transactions,
    ABS(a.calculated_balance - COALESCE(SUM(
        CASE 
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
        END
    ), 0)) as balance_difference
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
WHERE a.id IN (
    SELECT DISTINCT account_id 
    FROM lend_borrow 
    WHERE account_id IS NOT NULL
)
GROUP BY a.id, a.name, a.calculated_balance
HAVING ABS(a.calculated_balance - COALESCE(SUM(
    CASE 
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
    END
), 0)) > 0.01  -- Allow for small rounding differences
ORDER BY balance_difference DESC;

-- Step 7: Summary of migration results
SELECT 
    'MIGRATION_SUMMARY' as summary_type,
    'Total records in backup' as description,
    COUNT(*) as count
FROM lend_borrow_backup

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as summary_type,
    'Records with transaction_id after migration' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NOT NULL

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as summary_type,
    'Transactions created' as description,
    COUNT(*) as count
FROM transactions 
WHERE tags @> ARRAY['migrated'] AND category = 'Lend/Borrow'

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as summary_type,
    'Remaining unmigrated records' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NULL;