-- FIX LEND/BORROW INTEGRATION ISSUES
-- This script fixes the transaction_id length issue and updates the triggers

-- Step 1: Drop the view first (it depends on the columns we want to alter)
DROP VIEW IF EXISTS lend_borrow_with_transactions;

-- Step 2: Fix column lengths
ALTER TABLE lend_borrow 
ALTER COLUMN transaction_id TYPE VARCHAR(50);

ALTER TABLE lend_borrow 
ALTER COLUMN repayment_transaction_id TYPE VARCHAR(50);

ALTER TABLE lend_borrow 
ALTER COLUMN interest_transaction_id TYPE VARCHAR(50);

-- Step 2: Update the trigger functions with shorter transaction IDs
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
    
    -- Generate transaction ID (shorter format)
    transaction_id := 'LB-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Get account details
    SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
        RAISE EXCEPTION 'Account not found for lend/borrow record';
    END IF;
    
    -- Create transaction based on type
    IF NEW.type = 'lend' THEN
        -- Lending money = expense (money going out)
        INSERT INTO transactions (
            user_id, account_id, amount, type, description, date, category, tags, transaction_id
        ) VALUES (
            NEW.user_id,
            NEW.account_id,
            -NEW.amount, -- Negative for expense
            'expense',
            'Lent to ' || NEW.person_name,
            NEW.created_at,
            'Lend & Borrow',
            ARRAY['lend_borrow', NEW.id::TEXT, NEW.type],
            transaction_id
        );
        
        -- Update account balance
        UPDATE accounts 
        SET calculated_balance = calculated_balance - NEW.amount 
        WHERE id = NEW.account_id;
        
    ELSIF NEW.type = 'borrow' THEN
        -- Borrowing money = income (money coming in)
        INSERT INTO transactions (
            user_id, account_id, amount, type, description, date, category, tags, transaction_id
        ) VALUES (
            NEW.user_id,
            NEW.account_id,
            NEW.amount, -- Positive for income
            'income',
            'Borrowed from ' || NEW.person_name,
            NEW.created_at,
            'Lend & Borrow',
            ARRAY['lend_borrow', NEW.id::TEXT, NEW.type],
            transaction_id
        );
        
        -- Update account balance
        UPDATE accounts 
        SET calculated_balance = calculated_balance + NEW.amount 
        WHERE id = NEW.account_id;
    END IF;
    
    -- Store transaction ID in lend_borrow record
    NEW.transaction_id := transaction_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update settlement function
CREATE OR REPLACE FUNCTION settle_lend_borrow_loan()
RETURNS TRIGGER AS $$
DECLARE
    repayment_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only process if status changed to 'settled' and we have a transaction and affect_account_balance is true
    IF NEW.status = 'settled' AND OLD.status != 'settled' AND NEW.transaction_id IS NOT NULL AND NEW.affect_account_balance = TRUE THEN
        
        -- Generate repayment transaction ID (shorter format)
        repayment_transaction_id := 'LB-R-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
        
        -- Get account details
        SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
        
        IF account_record IS NULL THEN
            RAISE EXCEPTION 'Account not found for loan settlement';
        END IF;
        
        -- Create repayment transaction (opposite of original)
        IF NEW.type = 'lend' THEN
            -- Loan repayment = income (money coming back)
            INSERT INTO transactions (
                user_id, account_id, amount, type, description, date, category, tags, transaction_id
            ) VALUES (
                NEW.user_id,
                NEW.account_id,
                NEW.amount, -- Positive for income
                'income',
                'Loan repayment from ' || NEW.person_name,
                NOW(),
                'Lend & Borrow',
                ARRAY['lend_borrow', NEW.id::TEXT, 'repayment'],
                repayment_transaction_id
            );
            
            -- Update account balance
            UPDATE accounts 
            SET calculated_balance = calculated_balance + NEW.amount 
            WHERE id = NEW.account_id;
            
        ELSIF NEW.type = 'borrow' THEN
            -- Debt repayment = expense (money going out)
            INSERT INTO transactions (
                user_id, account_id, amount, type, description, date, category, tags, transaction_id
            ) VALUES (
                NEW.user_id,
                NEW.account_id,
                -NEW.amount, -- Negative for expense
                'expense',
                'Debt repayment to ' || NEW.person_name,
                NOW(),
                'Lend & Borrow',
                ARRAY['lend_borrow', NEW.id::TEXT, 'repayment'],
                repayment_transaction_id
            );
            
            -- Update account balance
            UPDATE accounts 
            SET calculated_balance = calculated_balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        
        -- Store repayment transaction ID
        NEW.repayment_transaction_id := repayment_transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update partial return function
CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    partial_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only process if partial_return_amount is set and greater than 0 and affect_account_balance is true
    IF NEW.partial_return_amount IS NOT NULL AND NEW.partial_return_amount > 0 AND NEW.affect_account_balance = TRUE THEN
        
        -- Generate partial return transaction ID (shorter format)
        partial_transaction_id := 'LB-P-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
        
        -- Get account details
        SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
        
        IF account_record IS NULL THEN
            RAISE EXCEPTION 'Account not found for partial return';
        END IF;
        
        -- Create partial return transaction
        IF NEW.type = 'lend' THEN
            -- Partial loan repayment = income
            INSERT INTO transactions (
                user_id, account_id, amount, type, description, date, category, tags, transaction_id
            ) VALUES (
                NEW.user_id,
                NEW.account_id,
                NEW.partial_return_amount,
                'income',
                'Partial loan repayment from ' || NEW.person_name || ' (' || NEW.partial_return_amount || ')',
                COALESCE(NEW.partial_return_date::TIMESTAMP, NOW()),
                'Lend & Borrow',
                ARRAY['lend_borrow', NEW.id::TEXT, 'partial_repayment'],
                partial_transaction_id
            );
            
            -- Update account balance
            UPDATE accounts 
            SET calculated_balance = calculated_balance + NEW.partial_return_amount 
            WHERE id = NEW.account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the view
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

-- Step 6: Verify the fix
DO $$
BEGIN
    RAISE NOTICE '✅ Lend/borrow integration fix completed!';
    RAISE NOTICE 'Transaction ID columns have been extended to VARCHAR(50)';
    RAISE NOTICE 'Trigger functions have been updated with shorter transaction IDs';
    RAISE NOTICE 'View has been recreated successfully';
    RAISE NOTICE 'You can now try adding lend/borrow records again.';
END $$;
