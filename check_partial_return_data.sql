-- Check if partial return data exists in database
-- This will verify if the partial return was properly added

-- Step 1: Check the specific Korshed Br record
SELECT 
    id,
    person_name,
    amount,
    currency,
    status,
    partial_return_amount,
    partial_return_date,
    account_id,
    affect_account_balance,
    created_at,
    updated_at
FROM lend_borrow 
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 2: Check all records with partial returns
SELECT 
    id,
    person_name,
    amount,
    currency,
    partial_return_amount,
    partial_return_date,
    status
FROM lend_borrow 
WHERE partial_return_amount IS NOT NULL 
AND partial_return_amount > 0
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53'
ORDER BY partial_return_date DESC;

-- Step 3: Count records with partial returns
SELECT 
    'PARTIAL_RETURN_SUMMARY' as section,
    'Records with partial returns' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE partial_return_amount IS NOT NULL 
AND partial_return_amount > 0
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 4: Check if the record was updated recently
SELECT 
    'UPDATE_VERIFICATION' as section,
    'Last updated' as description,
    updated_at as last_updated
FROM lend_borrow 
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
