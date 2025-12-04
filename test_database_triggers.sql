-- TEST DATABASE TRIGGERS FOR LEND/BORROW INTEGRATION
-- Run this to check if the triggers are working correctly

-- Test 1: Check if triggers exist
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name IN (
        'trigger_create_lend_borrow_transaction',
        'trigger_settle_lend_borrow_loan',
        'trigger_handle_partial_return'
    );
    
    RAISE NOTICE 'Trigger Status:';
    RAISE NOTICE 'Active triggers: %', trigger_count;
    
    IF trigger_count = 3 THEN
        RAISE NOTICE '✅ All triggers are active';
    ELSE
        RAISE NOTICE '❌ Some triggers are missing';
    END IF;
END $$;

-- Test 2: Check if functions exist
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN (
        'create_lend_borrow_transaction',
        'settle_lend_borrow_loan',
        'handle_partial_return'
    );
    
    RAISE NOTICE 'Function Status:';
    RAISE NOTICE 'Active functions: %', function_count;
    
    IF function_count = 3 THEN
        RAISE NOTICE '✅ All functions are active';
    ELSE
        RAISE NOTICE '❌ Some functions are missing';
    END IF;
END $$;

-- Test 3: Check if new columns exist
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'lend_borrow' 
    AND column_name IN ('account_id', 'transaction_id', 'affect_account_balance');
    
    RAISE NOTICE 'Column Status:';
    RAISE NOTICE 'New columns found: %', column_count;
    
    IF column_count = 3 THEN
        RAISE NOTICE '✅ All new columns exist';
    ELSE
        RAISE NOTICE '❌ Some columns are missing';
    END IF;
END $$;

-- Test 4: Test trigger with a sample record (if you have test data)
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
        RAISE NOTICE '⚠️  No test user or account found - skipping trigger test';
        RETURN;
    END IF;
    
    -- Get initial counts and balances
    SELECT COUNT(*) INTO transaction_count_before FROM transactions WHERE user_id = test_user_id;
    SELECT calculated_balance INTO account_balance_before FROM accounts WHERE id = test_account_id;
    
    RAISE NOTICE 'Testing trigger functionality...';
    RAISE NOTICE 'Initial transaction count: %', transaction_count_before;
    RAISE NOTICE 'Initial account balance: %', account_balance_before;
    
    -- Test creating a lend record
    INSERT INTO lend_borrow (
        user_id, type, person_name, amount, currency, account_id, affect_account_balance
    ) VALUES (
        test_user_id, 'lend', 'Test Person', 100.00, 'USD', test_account_id, true
    ) RETURNING id INTO test_lend_borrow_id;
    
    -- Check if transaction was created
    SELECT COUNT(*) INTO transaction_count_after FROM transactions WHERE user_id = test_user_id;
    SELECT calculated_balance INTO account_balance_after FROM accounts WHERE id = test_account_id;
    
    RAISE NOTICE 'After lend record creation:';
    RAISE NOTICE 'Transaction count: % (expected: %)', transaction_count_after, transaction_count_before + 1;
    RAISE NOTICE 'Account balance: % (expected: %)', account_balance_after, account_balance_before - 100.00;
    
    -- Clean up test data
    DELETE FROM lend_borrow WHERE id = test_lend_borrow_id;
    DELETE FROM transactions WHERE user_id = test_user_id AND 'lend_borrow' = ANY(tags);
    
    RAISE NOTICE '✅ Trigger test completed and cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Trigger test failed: %', SQLERRM;
        -- Clean up on error
        DELETE FROM lend_borrow WHERE id = test_lend_borrow_id;
        DELETE FROM transactions WHERE user_id = test_user_id AND 'lend_borrow' = ANY(tags);
END $$;

-- Final status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Database trigger test completed!';
    RAISE NOTICE 'Check the results above to see if triggers are working correctly.';
END $$;
