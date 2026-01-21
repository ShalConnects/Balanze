-- Fix settlement to use selected account instead of always using original account
-- When settling a lend/borrow record with account settlement method, use the selected account
-- from the return record (NEW.account_id) instead of always using the original account

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow_returns;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS handle_partial_return() CASCADE;

-- Step 3: Create updated handle_partial_return function that uses selected account
CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    original_record RECORD;
    total_returned DECIMAL;
    remaining_amount DECIMAL;
    transaction_id TEXT;
    account_to_use UUID; -- Account to use for transaction and balance update
BEGIN
    -- Get the original lend_borrow record
    SELECT * INTO original_record FROM lend_borrow WHERE id = NEW.lend_borrow_id;
    
    IF original_record IS NULL THEN
        RAISE EXCEPTION 'Original lend/borrow record not found';
    END IF;
    
    -- Calculate total returned amount for this lend/borrow record
    SELECT COALESCE(SUM(amount), 0) INTO total_returned 
    FROM lend_borrow_returns 
    WHERE lend_borrow_id = NEW.lend_borrow_id;
    
    -- Calculate remaining amount
    remaining_amount := original_record.amount - total_returned;
    
    -- Determine which account to use:
    -- 1. If NEW.account_id exists (selected account in return record), use it
    -- 2. Otherwise, fall back to original_record.account_id (for backward compatibility)
    account_to_use := COALESCE(NEW.account_id, original_record.account_id);
    
    -- Generate transaction ID for partial return
    transaction_id := 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Create transaction if affect_account_balance is true
    IF original_record.affect_account_balance = TRUE AND account_to_use IS NOT NULL THEN
        IF original_record.type = 'lend' THEN
            -- Partial return from borrower = income for lender
            INSERT INTO transactions (
                user_id, account_id, type, amount, description, category, date, tags, transaction_id
            ) VALUES (
                original_record.user_id,
                account_to_use, -- Use selected account or fall back to original
                'income',
                NEW.amount,
                'Partial return from ' || original_record.person_name,
                'Lend/Borrow',
                NEW.return_date,
                ARRAY['lend_borrow', 'partial_return'],
                transaction_id
            );
        ELSIF original_record.type = 'borrow' THEN
            -- Partial return to lender = expense for borrower
            INSERT INTO transactions (
                user_id, account_id, type, amount, description, category, date, tags, transaction_id
            ) VALUES (
                original_record.user_id,
                account_to_use, -- Use selected account or fall back to original
                'expense',
                NEW.amount,
                'Partial return to ' || original_record.person_name,
                'Lend/Borrow',
                NEW.return_date,
                ARRAY['lend_borrow', 'partial_return'],
                transaction_id
            );
        END IF;
        
        -- Update account balance for the account being used
        IF original_record.type = 'lend' THEN
            -- Lender receives money back (increase balance)
            UPDATE accounts 
            SET calculated_balance = calculated_balance + NEW.amount 
            WHERE id = account_to_use;
        ELSIF original_record.type = 'borrow' THEN
            -- Borrower pays money back (decrease balance)
            UPDATE accounts 
            SET calculated_balance = calculated_balance - NEW.amount 
            WHERE id = account_to_use;
        END IF;
    END IF;
    
    -- Update the lend_borrow record status based on remaining amount
    IF remaining_amount <= 0 THEN
        -- Fully paid, mark as settled
        UPDATE lend_borrow 
        SET status = 'settled', updated_at = NOW()
        WHERE id = NEW.lend_borrow_id;
    ELSE
        -- Still has remaining amount, keep as active
        UPDATE lend_borrow 
        SET updated_at = NOW()
        WHERE id = NEW.lend_borrow_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger
CREATE TRIGGER trigger_handle_partial_return
    AFTER INSERT ON lend_borrow_returns
    FOR EACH ROW
    EXECUTE FUNCTION handle_partial_return();

-- Step 5: Verify the fix
SELECT 'Settlement account selection fix applied - uses selected account from return record' as status;
