-- Fix accounts table to add balance column
-- The frontend expects a 'balance' column but the table has 'calculated_balance'

-- Add balance column as an alias/computed column
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;

-- Update existing records to use calculated_balance as balance
UPDATE accounts 
SET balance = COALESCE(calculated_balance, initial_balance, 0)
WHERE balance = 0;

-- Create a trigger to keep balance in sync with calculated_balance
CREATE OR REPLACE FUNCTION update_accounts_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- If calculated_balance is updated, sync it to balance
    IF TG_OP = 'UPDATE' AND NEW.calculated_balance IS DISTINCT FROM OLD.calculated_balance THEN
        NEW.balance = NEW.calculated_balance;
    END IF;
    
    -- If balance is updated, sync it to calculated_balance
    IF TG_OP = 'UPDATE' AND NEW.balance IS DISTINCT FROM OLD.balance THEN
        NEW.calculated_balance = NEW.balance;
    END IF;
    
    -- For new records, set balance from calculated_balance
    IF TG_OP = 'INSERT' THEN
        NEW.balance = COALESCE(NEW.calculated_balance, NEW.initial_balance, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_accounts_balance_trigger ON accounts;

-- Create the trigger
CREATE TRIGGER update_accounts_balance_trigger
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_accounts_balance();

-- Update all existing records to sync balance
UPDATE accounts 
SET balance = COALESCE(calculated_balance, initial_balance, 0);
