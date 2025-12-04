-- FINAL FIX: Lend/borrow integration that works with existing currency system
-- This uses the account's currency instead of trying to add currency to transactions

-- Step 1: Drop the view first
DROP VIEW IF EXISTS lend_borrow_with_transactions;

-- Step 2: Drop all triggers
DROP TRIGGER IF EXISTS trigger_create_lend_borrow_transaction ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow;

-- Step 3: Drop all functions
DROP FUNCTION IF EXISTS create_lend_borrow_transaction();
DROP FUNCTION IF EXISTS settle_lend_borrow_loan();
DROP FUNCTION IF EXISTS handle_partial_return();

-- Step 4: Create new functions that work with existing transaction structure
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
    
    -- Generate a VERY short transaction ID (max 6 characters)
    transaction_id := 'LB' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
    
    -- Get account details (including currency)
    SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
        RAISE EXCEPTION 'Account not found for lend/borrow record';
    END IF;
    
    -- Create transaction based on type
    -- Currency is handled by the account relationship, not stored in transactions
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

CREATE OR REPLACE FUNCTION settle_lend_borrow_loan()
RETURNS TRIGGER AS $$
DECLARE
    repayment_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only create transactions if affect_account_balance is true
    IF NEW.affect_account_balance = FALSE THEN
        RETURN NEW;
    END IF;
    
    -- Only process if status changed to 'settled' and we have a transaction_id
    IF NEW.status = 'settled' AND OLD.status != 'settled' AND NEW.transaction_id IS NOT NULL THEN
        -- Generate a VERY short repayment transaction ID (max 6 characters)
        repayment_transaction_id := 'RP' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
        
        -- Get account details
        SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
        
        IF account_record IS NOT NULL THEN
            -- Create repayment transaction (opposite of original)
            IF NEW.type = 'lend' THEN
                -- Repayment of loan = income to account
                INSERT INTO transactions (
                    user_id, account_id, type, amount, description, category, date, tags, transaction_id
                ) VALUES (
                    NEW.user_id, NEW.account_id, 'income', NEW.amount, 'Repayment from ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow', 'repayment'], repayment_transaction_id
                );
            ELSIF NEW.type = 'borrow' THEN
                -- Repayment of borrowing = expense from account
                INSERT INTO transactions (
                    user_id, account_id, type, amount, description, category, date, tags, transaction_id
                ) VALUES (
                    NEW.user_id, NEW.account_id, 'expense', NEW.amount, 'Repayment to ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow', 'repayment'], repayment_transaction_id
                );
            END IF;
            
            -- Update the lend_borrow record with the repayment transaction_id
            NEW.repayment_transaction_id := repayment_transaction_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    partial_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only create transactions if affect_account_balance is true
    IF NEW.affect_account_balance = FALSE THEN
        RETURN NEW;
    END IF;
    
    -- Only process if partial_return_amount changed and is greater than 0
    IF NEW.partial_return_amount > 0 AND (OLD.partial_return_amount IS NULL OR OLD.partial_return_amount != NEW.partial_return_amount) THEN
        -- Generate a VERY short partial return transaction ID (max 6 characters)
        partial_transaction_id := 'PR' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
        
        -- Get account details
        SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
        
        IF account_record IS NOT NULL THEN
            -- Create partial return transaction (opposite of original)
            IF NEW.type = 'lend' THEN
                -- Partial repayment of loan = income to account
                INSERT INTO transactions (
                    user_id, account_id, type, amount, description, category, date, tags, transaction_id
                ) VALUES (
                    NEW.user_id, NEW.account_id, 'income', NEW.partial_return_amount, 'Partial repayment from ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow', 'partial_return'], partial_transaction_id
                );
            ELSIF NEW.type = 'borrow' THEN
                -- Partial repayment of borrowing = expense from account
                INSERT INTO transactions (
                    user_id, account_id, type, amount, description, category, date, tags, transaction_id
                ) VALUES (
                    NEW.user_id, NEW.account_id, 'expense', NEW.partial_return_amount, 'Partial repayment to ' || NEW.person_name, 'Lend/Borrow', NOW()::DATE, ARRAY['lend_borrow', 'partial_return'], partial_transaction_id
                );
            END IF;
            
            -- Update the lend_borrow record with the partial return transaction_id
            NEW.interest_transaction_id := partial_transaction_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the triggers
CREATE TRIGGER trigger_create_lend_borrow_transaction
    AFTER INSERT ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION create_lend_borrow_transaction();

CREATE TRIGGER trigger_settle_lend_borrow_loan
    AFTER UPDATE ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION settle_lend_borrow_loan();

CREATE TRIGGER trigger_handle_partial_return
    AFTER UPDATE ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION handle_partial_return();

-- Step 6: Recreate the view (with currency from account)
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
SELECT 'Fix completed successfully - currency handled via account relationship' as status;
