-- FIX TRANSACTION_ID LENGTH ISSUE
-- The transaction_id column is too short for the generated IDs

-- Check current column length
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
AND column_name = 'transaction_id';

-- Fix the column length
ALTER TABLE lend_borrow 
ALTER COLUMN transaction_id TYPE VARCHAR(50);

-- Also fix other transaction ID columns
ALTER TABLE lend_borrow 
ALTER COLUMN repayment_transaction_id TYPE VARCHAR(50);

ALTER TABLE lend_borrow 
ALTER COLUMN interest_transaction_id TYPE VARCHAR(50);

-- Check the fix
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
AND column_name IN ('transaction_id', 'repayment_transaction_id', 'interest_transaction_id');
