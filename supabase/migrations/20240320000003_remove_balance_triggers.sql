-- Drop the trigger that updates the balance column after transaction changes
DROP TRIGGER IF EXISTS update_balance_after_transaction ON transactions;

-- Drop the function that updates the balance column
DROP FUNCTION IF EXISTS update_account_balance; 