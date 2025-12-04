-- FIX TRIGGER TRANSACTION ID GENERATION
-- Make transaction IDs much shorter to avoid length issues

-- Update the create_lend_borrow_transaction function with shorter IDs
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
    
    -- Generate much shorter transaction ID
    transaction_id := 'LB' || SUBSTRING(NEW.id::TEXT, 1, 6) || EXTRACT(EPOCH FROM NOW())::TEXT;
    
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

-- Update the settle_lend_borrow_loan function with shorter IDs
CREATE OR REPLACE FUNCTION settle_lend_borrow_loan()
RETURNS TRIGGER AS $$
DECLARE
    repayment_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only process if status changed to 'settled' and we have a transaction and affect_account_balance is true
    IF NEW.status = 'settled' AND OLD.status != 'settled' AND NEW.transaction_id IS NOT NULL AND NEW.affect_account_balance = TRUE THEN
        
        -- Generate much shorter repayment transaction ID
        repayment_transaction_id := 'LBR' || SUBSTRING(NEW.id::TEXT, 1, 6) || EXTRACT(EPOCH FROM NOW())::TEXT;
        
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

-- Update the handle_partial_return function with shorter IDs
CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    partial_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only process if partial_return_amount is set and greater than 0 and affect_account_balance is true
    IF NEW.partial_return_amount IS NOT NULL AND NEW.partial_return_amount > 0 AND NEW.affect_account_balance = TRUE THEN
        
        -- Generate much shorter partial return transaction ID
        partial_transaction_id := 'LBP' || SUBSTRING(NEW.id::TEXT, 1, 6) || EXTRACT(EPOCH FROM NOW())::TEXT;
        
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

-- Test message
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger functions updated with shorter transaction IDs!';
    RAISE NOTICE 'Transaction IDs are now much shorter and should work.';
    RAISE NOTICE 'Try adding a lend/borrow record again.';
END $$;
