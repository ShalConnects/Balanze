-- Update settlement trigger to remove automatic transaction creation
-- Settlement transactions will now be created manually via frontend with account selection

-- Step 1: Drop the view first
DROP VIEW IF EXISTS lend_borrow_with_transactions;

-- Step 2: Drop the settlement trigger
DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;

-- Step 3: Drop the settlement function
DROP FUNCTION IF EXISTS settle_lend_borrow_loan();

-- Step 4: Create new settlement function that only updates status
CREATE OR REPLACE FUNCTION settle_lend_borrow_loan()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status changed to 'settled'
    IF NEW.status = 'settled' AND OLD.status != 'settled' THEN
        -- Just update the status, no automatic transactions
        -- Settlement transactions will be created manually via frontend
        NULL; -- No automatic transaction creation
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger
CREATE TRIGGER trigger_settle_lend_borrow_loan
    AFTER UPDATE ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION settle_lend_borrow_loan();

-- Step 6: Recreate the view
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

-- Step 7: Verify the fix
SELECT 'Settlement trigger updated - no automatic transactions' as status;
