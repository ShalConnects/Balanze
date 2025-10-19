-- Update Lend/Borrow Transaction ID Generation
-- Change from LB + 4 random chars to LB + 6 random digits
-- This affects: creation, settlement, and partial refunds

-- Step 1: Update the create_lend_borrow_transaction function
CREATE OR REPLACE FUNCTION create_lend_borrow_transaction()
RETURNS TRIGGER AS $$
DECLARE
    transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only create transactions if affect_account_balance is true
    IF NEW.affect_account_balance = FALSE THEN
        RETURN NEW;
    END IF;
    
    -- Generate transaction ID: LB + 6 random digits
    transaction_id := 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Get account details
    SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
        RAISE EXCEPTION 'Account not found for lend/borrow record';
    END IF;
    
    -- Create transaction based on type
    IF NEW.type = 'lend' THEN
        -- Lending money = expense from account
        INSERT INTO transactions (
            user_id, account_id, type, amount, description, category, date, tags, transaction_id
        ) VALUES (
            NEW.user_id, NEW.account_id, 'expense', NEW.amount, 'Lent to ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow'], transaction_id
        );
    ELSIF NEW.type = 'borrow' THEN
        -- Borrowing money = income to account
        INSERT INTO transactions (
            user_id, account_id, type, amount, description, category, date, tags, transaction_id
        ) VALUES (
            NEW.user_id, NEW.account_id, 'income', NEW.amount, 'Borrowed from ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow'], transaction_id
        );
    END IF;
    
    -- Update the lend_borrow record with the new transaction_id
    NEW.transaction_id := transaction_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update the settle_lend_borrow_loan function (if it creates transactions)
CREATE OR REPLACE FUNCTION settle_lend_borrow_loan()
RETURNS TRIGGER AS $$
BEGIN
    -- This function now only updates the status to 'settled'
    -- The actual repayment transaction is handled by the frontend via the SettlementModal
    NEW.status = 'settled';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update the handle_partial_return function
CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    return_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only create transactions if the original lend/borrow record affects account balance
    IF NOT EXISTS (
        SELECT 1 FROM lend_borrow 
        WHERE id = NEW.lend_borrow_id 
        AND affect_account_balance = TRUE
    ) THEN
        RETURN NEW;
    END IF;
    
    -- Generate transaction ID: LB + 6 random digits
    return_transaction_id := 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Get account details from the original lend/borrow record
    SELECT a.* INTO account_record 
    FROM accounts a 
    JOIN lend_borrow lb ON a.id = lb.account_id 
    WHERE lb.id = NEW.lend_borrow_id;
    
    IF account_record IS NULL THEN
        RAISE EXCEPTION 'Account not found for partial return';
    END IF;
    
    -- Get the original lend/borrow record to determine transaction type
    DECLARE
        original_record RECORD;
    BEGIN
        SELECT type INTO original_record FROM lend_borrow WHERE id = NEW.lend_borrow_id;
        
        -- Create opposite transaction for partial return
        IF original_record.type = 'lend' THEN
            -- Partial return of loan = income to account
            INSERT INTO transactions (
                user_id, account_id, type, amount, description, category, date, tags, transaction_id
            ) VALUES (
                NEW.user_id, account_record.id, 'income', NEW.amount, 'Partial return from ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow', 'partial_return'], return_transaction_id
            );
        ELSIF original_record.type = 'borrow' THEN
            -- Partial return of borrowed money = expense from account
            INSERT INTO transactions (
                user_id, account_id, type, amount, description, category, date, tags, transaction_id
            ) VALUES (
                NEW.user_id, account_record.id, 'expense', NEW.amount, 'Partial return to ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow', 'partial_return'], return_transaction_id
            );
        END IF;
    END;
    
    -- Update the partial return record with the transaction_id
    NEW.transaction_id := return_transaction_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Ensure triggers are properly set up
DROP TRIGGER IF EXISTS trigger_create_lend_borrow_transaction ON lend_borrow;
CREATE TRIGGER trigger_create_lend_borrow_transaction
    AFTER INSERT ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION create_lend_borrow_transaction();

DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;
CREATE TRIGGER trigger_settle_lend_borrow_loan
    BEFORE UPDATE ON lend_borrow
    FOR EACH ROW
    WHEN (OLD.status = 'active' AND NEW.status = 'settled')
    EXECUTE FUNCTION settle_lend_borrow_loan();

DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow_returns;
CREATE TRIGGER trigger_handle_partial_return
    AFTER INSERT ON lend_borrow_returns
    FOR EACH ROW
    EXECUTE FUNCTION handle_partial_return();

-- Step 5: Update existing lend/borrow records with new format (optional)
-- This will update any existing records that might have the old format
UPDATE lend_borrow 
SET transaction_id = 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE transaction_id IS NOT NULL 
AND transaction_id NOT LIKE 'LB______';

-- Check if lend_borrow_returns has transaction_id column before updating
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lend_borrow_returns' 
        AND column_name = 'transaction_id'
    ) THEN
        -- Update partial return records if column exists
        UPDATE lend_borrow_returns 
        SET transaction_id = 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
        WHERE transaction_id IS NOT NULL 
        AND transaction_id NOT LIKE 'LB______';
    END IF;
END $$;

-- Verify the changes
SELECT 
    'Lend/Borrow Transaction ID Update Complete' as status,
    'All lend/borrow transactions now use LB + 6 digits format' as message;
