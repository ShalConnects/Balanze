-- QUICK FIX FOR TRANSACTION ID LENGTH ISSUE
-- This script fixes the VARCHAR(8) constraint that's causing the error

-- Step 1: Check current column lengths
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
AND column_name IN ('transaction_id', 'repayment_transaction_id', 'interest_transaction_id');

-- Step 2: Drop the view first (it might be preventing column alteration)
DROP VIEW IF EXISTS lend_borrow_with_transactions;

-- Step 3: Fix column lengths to support longer transaction IDs
ALTER TABLE lend_borrow 
ALTER COLUMN transaction_id TYPE VARCHAR(100);

ALTER TABLE lend_borrow 
ALTER COLUMN repayment_transaction_id TYPE VARCHAR(100);

ALTER TABLE lend_borrow 
ALTER COLUMN interest_transaction_id TYPE VARCHAR(100);

-- Step 4: Recreate the view
CREATE OR REPLACE VIEW lend_borrow_with_transactions AS
SELECT 
    lb.*,
    a.name as account_name,
    a.currency as account_currency,
    t.amount as transaction_amount,
    t.type as transaction_type,
    t.date as transaction_date
FROM lend_borrow lb
LEFT JOIN accounts a ON lb.account_id = a.id
LEFT JOIN transactions t ON lb.transaction_id = t.transaction_id;

-- Step 5: Verify the fix
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
AND column_name IN ('transaction_id', 'repayment_transaction_id', 'interest_transaction_id');

-- Step 6: Test message
DO $$
BEGIN
    RAISE NOTICE '✅ Transaction ID length fix completed!';
    RAISE NOTICE 'All transaction ID columns now support up to 100 characters.';
    RAISE NOTICE 'You can now try adding lend/borrow records again.';
END $$;
