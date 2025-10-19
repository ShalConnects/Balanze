-- TEST SCRIPT FOR LEND/BORROW ACCOUNT INTEGRATION
-- Run this to test the integration functionality

-- Test 1: Check if new columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lend_borrow' 
        AND column_name = 'account_id'
    ) THEN
        RAISE NOTICE '✅ account_id column exists';
    ELSE
        RAISE NOTICE '❌ account_id column missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lend_borrow' 
        AND column_name = 'transaction_id'
    ) THEN
        RAISE NOTICE '✅ transaction_id column exists';
    ELSE
        RAISE NOTICE '❌ transaction_id column missing';
    END IF;
END $$;

-- Test 2: Check if triggers exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_create_lend_borrow_transaction'
    ) THEN
        RAISE NOTICE '✅ create_lend_borrow_transaction trigger exists';
    ELSE
        RAISE NOTICE '❌ create_lend_borrow_transaction trigger missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_settle_lend_borrow_loan'
    ) THEN
        RAISE NOTICE '✅ settle_lend_borrow_loan trigger exists';
    ELSE
        RAISE NOTICE '❌ settle_lend_borrow_loan trigger missing';
    END IF;
END $$;

-- Test 3: Check if functions exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'create_lend_borrow_transaction'
    ) THEN
        RAISE NOTICE '✅ create_lend_borrow_transaction function exists';
    ELSE
        RAISE NOTICE '❌ create_lend_borrow_transaction function missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'settle_lend_borrow_loan'
    ) THEN
        RAISE NOTICE '✅ settle_lend_borrow_loan function exists';
    ELSE
        RAISE NOTICE '❌ settle_lend_borrow_loan function missing';
    END IF;
END $$;

-- Test 4: Check if view exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'lend_borrow_with_transactions'
    ) THEN
        RAISE NOTICE '✅ lend_borrow_with_transactions view exists';
    ELSE
        RAISE NOTICE '❌ lend_borrow_with_transactions view missing';
    END IF;
END $$;

-- Test 5: Test the integration with a sample record
-- (This should only be run in a test environment)
DO $$
DECLARE
    test_user_id UUID;
    test_account_id UUID;
    test_lend_borrow_id UUID;
    transaction_count_before INTEGER;
    transaction_count_after INTEGER;
    account_balance_before DECIMAL;
    account_balance_after DECIMAL;
BEGIN
    -- Get a test user and account
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    SELECT id INTO test_account_id FROM accounts WHERE user_id = test_user_id LIMIT 1;
    
    IF test_user_id IS NULL OR test_account_id IS NULL THEN
        RAISE NOTICE '⚠️  No test user or account found - skipping integration test';
        RETURN;
    END IF;
    
    -- Get initial counts and balances
    SELECT COUNT(*) INTO transaction_count_before FROM transactions WHERE user_id = test_user_id;
    SELECT calculated_balance INTO account_balance_before FROM accounts WHERE id = test_account_id;
    
    RAISE NOTICE 'Testing lend/borrow integration...';
    RAISE NOTICE 'Initial transaction count: %', transaction_count_before;
    RAISE NOTICE 'Initial account balance: %', account_balance_before;
    
    -- Test creating a lend record
    INSERT INTO lend_borrow (
        user_id, type, person_name, amount, currency, account_id
    ) VALUES (
        test_user_id, 'lend', 'Test Person', 100.00, 'USD', test_account_id
    ) RETURNING id INTO test_lend_borrow_id;
    
    -- Check if transaction was created
    SELECT COUNT(*) INTO transaction_count_after FROM transactions WHERE user_id = test_user_id;
    SELECT calculated_balance INTO account_balance_after FROM accounts WHERE id = test_account_id;
    
    RAISE NOTICE 'After lend record creation:';
    RAISE NOTICE 'Transaction count: % (expected: %)', transaction_count_after, transaction_count_before + 1;
    RAISE NOTICE 'Account balance: % (expected: %)', account_balance_after, account_balance_before - 100.00;
    
    -- Test settling the loan
    UPDATE lend_borrow 
    SET status = 'settled' 
    WHERE id = test_lend_borrow_id;
    
    -- Check final state
    SELECT COUNT(*) INTO transaction_count_after FROM transactions WHERE user_id = test_user_id;
    SELECT calculated_balance INTO account_balance_after FROM accounts WHERE id = test_account_id;
    
    RAISE NOTICE 'After loan settlement:';
    RAISE NOTICE 'Transaction count: % (expected: %)', transaction_count_after, transaction_count_before + 2;
    RAISE NOTICE 'Account balance: % (expected: %)', account_balance_after, account_balance_before;
    
    -- Clean up test data
    DELETE FROM lend_borrow WHERE id = test_lend_borrow_id;
    DELETE FROM transactions WHERE user_id = test_user_id AND 'lend_borrow' = ANY(tags);
    
    RAISE NOTICE '✅ Integration test completed and cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Integration test failed: %', SQLERRM;
        -- Clean up on error
        DELETE FROM lend_borrow WHERE id = test_lend_borrow_id;
        DELETE FROM transactions WHERE user_id = test_user_id AND 'lend_borrow' = ANY(tags);
END $$;

-- Test 6: Check for any existing lend/borrow records that need migration
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count 
    FROM lend_borrow 
    WHERE account_id IS NULL;
    
    IF unmigrated_count > 0 THEN
        RAISE NOTICE '⚠️  Found % lend/borrow records without account_id - migration needed', unmigrated_count;
    ELSE
        RAISE NOTICE '✅ All lend/borrow records have account_id assigned';
    END IF;
END $$;

-- Final status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Lend/borrow account integration test completed!';
    RAISE NOTICE 'If all tests passed, the integration is working correctly.';
    RAISE NOTICE 'If any tests failed, check the error messages above.';
END $$;
