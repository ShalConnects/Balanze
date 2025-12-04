-- Convert Migrated Records to Record-Only Mode
-- This will disconnect the records from accounts while preserving all data

-- Step 1: Create backup of current state
CREATE TABLE IF NOT EXISTS lend_borrow_migration_backup AS 
SELECT * FROM lend_borrow WHERE account_id IS NOT NULL AND transaction_id IS NOT NULL;

-- Step 2: Update records to record-only mode
-- This will:
-- 1. Set affect_account_balance to false (record-only mode)
-- 2. Keep account_id and transaction_id for reference but disconnect from account calculations
-- 3. Preserve all other data

UPDATE lend_borrow 
SET 
    affect_account_balance = false,
    account_id = NULL  -- Remove account linkage
WHERE 
    account_id IS NOT NULL 
    AND transaction_id IS NOT NULL
    AND id IN (
        '4967ccc2-54ee-4c60-a985-0073176d53dc',
        'e715f1c5-a75b-403b-a22b-303b5d8994e0',
        '94b2474c-e367-4a89-a101-bbf486560373',
        '0f25414c-8b0a-4d51-8cdc-08b881b290b9',
        '22c16e2c-c1de-4320-8620-086b436c9271',
        '4aed26a3-e0ce-4f5d-836a-778ec133a753',
        '2cd3c038-4261-47fa-8aa3-efc0701a6805',
        'c80cad6d-43f4-479d-abdb-afff3433c0f4',
        'f6bece6a-db9f-4149-a012-e7abd5d576df',
        'c051f4e5-a897-40c6-8840-f52cf504daea',
        '9f3da3e7-7f84-4ecf-97f2-7da1eb522a9b',
        '4762556c-439f-4d25-8e40-7fa5a5b95005',
        '5307bae7-c17c-451c-abbe-e0070785fce4',
        'be300643-0b76-4624-b615-977bca5a2e84',
        '78e575c5-6e41-4a60-948f-354f22df31eb',
        '74574ec2-5540-454b-a3a1-c1a8da5cb693',
        '066d975f-326f-4aec-8832-b0f4c3215eff',
        'ee640334-c41a-428f-988c-5dfc91ca64da',
        'd0f2b33b-4ff3-4b09-840f-08403ce65e84',
        'da18371c-f2a5-4aeb-a5e3-5fbcdc508546',
        'e25234dd-d46e-42f2-88d0-7f8c1ecd4042',
        '5a6a1d39-5030-4c9d-923e-856324f5f78e',
        'a0c6447a-a42e-44f5-9233-8dbb0bbed22b',
        '2a5b21e7-9fee-4596-8b79-7e8b3de985d0',
        'ee338478-25f3-48a0-993b-318442c759f2'
    );

-- Step 3: Verify the changes
SELECT 
    'CONVERSION_SUMMARY' as section,
    'Records converted to record-only mode' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE account_id IS NULL 
AND transaction_id IS NOT NULL
AND affect_account_balance = false;

-- Step 4: Show sample of converted records
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
WHERE account_id IS NULL 
AND transaction_id IS NOT NULL
AND affect_account_balance = false
LIMIT 5;
