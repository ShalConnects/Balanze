-- Fix partial return double counting issue
-- This script adds account_id to lend_borrow_returns table and updates the trigger
-- to use the correct account instead of the original lend_borrow account

-- Step 1: Add account_id column to lend_borrow_returns table
ALTER TABLE lend_borrow_returns 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Step 2: Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow_returns;

-- Step 3: Drop the existing function
DROP FUNCTION IF EXISTS handle_partial_return() CASCADE;

-- Step 4: Create updated handle_partial_return function
CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    original_record RECORD;
    total_returned DECIMAL;
    remaining_amount DECIMAL;
    transaction_id TEXT;
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
    
    -- Generate transaction ID for partial return
    transaction_id := 'LB' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Create transaction if affect_account_balance is true
    IF original_record.affect_account_balance = TRUE THEN
        -- Use the account_id from the return record (NEW.account_id) instead of original account
        IF original_record.type = 'lend' THEN
            -- Partial return from borrower = income for lender
            INSERT INTO transactions (
                user_id, account_id, type, amount, description, category, date, tags, transaction_id
            ) VALUES (
                original_record.user_id,
                NEW.account_id, -- Use the account from the return record
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
                NEW.account_id, -- Use the account from the return record
                'expense',
                NEW.amount,
                'Partial return to ' || original_record.person_name,
                'Lend/Borrow',
                NEW.return_date,
                ARRAY['lend_borrow', 'partial_return'],
                transaction_id
            );
        END IF;
        
        -- Update account balance for the return account
        UPDATE accounts 
        SET calculated_balance = calculated_balance + NEW.amount 
        WHERE id = NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger
CREATE TRIGGER trigger_handle_partial_return
    AFTER INSERT ON lend_borrow_returns
    FOR EACH ROW
    EXECUTE FUNCTION handle_partial_return();

-- Step 6: Test message
DO $$
BEGIN
    RAISE NOTICE '✅ Partial return double counting fix applied successfully!';
    RAISE NOTICE 'The trigger now uses the account_id from lend_borrow_returns instead of the original lend_borrow account.';
END $$;
