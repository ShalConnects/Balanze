-- ROLLBACK SCRIPT FOR LEND/BORROW ACCOUNT INTEGRATION
-- Run this if you need to revert the account integration changes
-- WARNING: This will remove all account integration functionality

-- Step 1: Drop all triggers
DROP TRIGGER IF EXISTS trigger_create_lend_borrow_transaction ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS create_lend_borrow_transaction();
DROP FUNCTION IF EXISTS settle_lend_borrow_loan();
DROP FUNCTION IF EXISTS handle_partial_return();
DROP FUNCTION IF EXISTS rollback_lend_borrow_integration();

-- Step 3: Drop the view
DROP VIEW IF EXISTS lend_borrow_with_transactions;

-- Step 4: Remove transaction records created by lend/borrow integration
-- This will delete all transactions with 'lend_borrow' tags
DELETE FROM transactions 
WHERE 'lend_borrow' = ANY(tags);

-- Step 5: Recalculate account balances (remove lend/borrow transaction effects)
-- This is a simplified approach - in production you might want to be more careful
UPDATE accounts 
SET calculated_balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount 
            WHEN type = 'expense' THEN -amount 
            ELSE 0 
        END
    ), 0)
    FROM transactions 
    WHERE account_id = accounts.id 
    AND 'lend_borrow' != ALL(tags) -- Exclude lend/borrow transactions
);

-- Step 6: Remove the new columns (optional - comment out if you want to keep them)
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS account_id;
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS transaction_id;
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS repayment_transaction_id;
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS interest_transaction_id;

-- Step 7: Drop indexes
DROP INDEX IF EXISTS idx_lend_borrow_account_id;
DROP INDEX IF EXISTS idx_lend_borrow_transaction_id;
DROP INDEX IF EXISTS idx_lend_borrow_repayment_transaction_id;

-- Step 8: Success message
DO $$
BEGIN
    RAISE NOTICE 'Lend/borrow account integration has been rolled back successfully!';
    RAISE NOTICE 'All account integration features have been removed.';
    RAISE NOTICE 'Lend/borrow records are now standalone again.';
    RAISE NOTICE 'Account balances have been recalculated without lend/borrow effects.';
END $$;
