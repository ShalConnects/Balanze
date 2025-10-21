-- Force refresh by updating the record timestamp
-- This will trigger the frontend to refetch the data

UPDATE lend_borrow 
SET updated_at = CURRENT_TIMESTAMP
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Verify the update
SELECT 
    id,
    person_name,
    partial_return_amount,
    partial_return_date,
    updated_at
FROM lend_borrow 
WHERE id = '4762556c-439f-4d25-8e40-7fa5a5b95005'
AND user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';
