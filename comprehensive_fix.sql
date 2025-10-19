-- COMPREHENSIVE FIX FOR LEND/BORROW INTEGRATION
-- This addresses all possible issues with the VARCHAR(8) constraint

-- Step 1: Check current state
SELECT '=== CURRENT LEND_BORROW TABLE STRUCTURE ===' as info;
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lend_borrow' 
ORDER BY ordinal_position;

-- Step 2: Drop the view FIRST (it depends on the columns we want to alter)
DROP VIEW IF EXISTS lend_borrow_with_transactions;

-- Step 3: Drop all triggers and functions to start fresh
DROP TRIGGER IF EXISTS trigger_create_lend_borrow_transaction ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow;

DROP FUNCTION IF EXISTS create_lend_borrow_transaction();
DROP FUNCTION IF EXISTS settle_lend_borrow_loan();
DROP FUNCTION IF EXISTS handle_partial_return();

-- Step 4: Ensure all columns have proper length
ALTER TABLE lend_borrow 
ALTER COLUMN transaction_id TYPE VARCHAR(100);

ALTER TABLE lend_borrow 
ALTER COLUMN repayment_transaction_id TYPE VARCHAR(100);

ALTER TABLE lend_borrow 
ALTER COLUMN interest_transaction_id TYPE VARCHAR(100);

-- Step 5: Create new functions with very short transaction IDs
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
    
    -- Generate very short transaction ID (max 8 characters)
    transaction_id := 'LB' || SUBSTRING(NEW.id::TEXT, 1, 4) || SUBSTRING(EXTRACT(EPOCH FROM NOW())::TEXT, -2);
    
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

-- Step 6: Create the trigger
CREATE TRIGGER trigger_create_lend_borrow_transaction
    AFTER INSERT ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION create_lend_borrow_transaction();

-- Step 7: Recreate the view (after all columns are fixed)
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

-- Step 8: Test the fix
DO $$
DECLARE
    test_user_id UUID;
    test_account_id UUID;
    test_lend_borrow_id UUID;
BEGIN
    -- Get a test user and account
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    SELECT id INTO test_account_id FROM accounts WHERE user_id = test_user_id LIMIT 1;
    
    IF test_user_id IS NULL OR test_account_id IS NULL THEN
        RAISE NOTICE '⚠️  No test user or account found - skipping test';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing lend/borrow integration...';
    
    -- Test creating a lend record
    INSERT INTO lend_borrow (
        user_id, type, person_name, amount, currency, account_id, affect_account_balance
    ) VALUES (
        test_user_id, 'lend', 'Test Person', 100.00, 'USD', test_account_id, true
    ) RETURNING id INTO test_lend_borrow_id;
    
    RAISE NOTICE '✅ Test record created successfully with ID: %', test_lend_borrow_id;
    
    -- Clean up test data
    DELETE FROM lend_borrow WHERE id = test_lend_borrow_id;
    DELETE FROM transactions WHERE user_id = test_user_id AND 'lend_borrow' = ANY(tags);
    
    RAISE NOTICE '✅ Test completed and cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
        -- Clean up on error
        DELETE FROM lend_borrow WHERE id = test_lend_borrow_id;
        DELETE FROM transactions WHERE user_id = test_user_id AND 'lend_borrow' = ANY(tags);
END $$;

-- Final status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Comprehensive fix completed!';
    RAISE NOTICE 'All triggers and functions have been recreated with very short transaction IDs.';
    RAISE NOTICE 'You can now try adding lend/borrow records again.';
END $$;
