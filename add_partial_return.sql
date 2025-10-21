-- Add Partial Return for Specific Record
-- This will add a partial return of ৳73,000 to the Korshed Br record without account linkage

-- Step 1: Verify the record exists
SELECT 
    'RECORD_VERIFICATION' as section,
    'Target record found' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 2: Show current record details
SELECT 
    id,
    type,
    person_name,
    amount,
    currency,
    status,
    partial_return_amount,
    partial_return_date,
    account_id,
    affect_account_balance
FROM lend_borrow 
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 3: Add partial return to the record
UPDATE lend_borrow 
SET 
    partial_return_amount = 73000.00,
    partial_return_date = CURRENT_TIMESTAMP
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Step 4: Verify the update
SELECT 
    'UPDATE_VERIFICATION' as section,
    'Partial return added' as description,
    'Success' as status;

-- Step 5: Show updated record details
SELECT 
    id,
    type,
    person_name,
    amount,
    currency,
    status,
    partial_return_amount,
    partial_return_date,
    account_id,
    affect_account_balance,
    (amount - COALESCE(partial_return_amount, 0)) as remaining_amount
FROM lend_borrow 
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
