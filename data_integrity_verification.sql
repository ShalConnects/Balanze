-- DATA INTEGRITY VERIFICATION SCRIPT
-- Run this to check if the integration is working correctly

-- Check 1: Verify account balances are correct
DO $$
DECLARE
    account_record RECORD;
    calculated_balance DECIMAL;
    actual_balance DECIMAL;
    discrepancy_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking account balance integrity...';
    
    FOR account_record IN 
        SELECT id, calculated_balance FROM accounts
    LOOP
        -- Calculate what the balance should be
        SELECT COALESCE(SUM(
            CASE 
                WHEN type = 'income' THEN amount 
                WHEN type = 'expense' THEN -amount 
                ELSE 0 
            END
        ), 0) INTO calculated_balance
        FROM transactions 
        WHERE account_id = account_record.id;
        
        actual_balance := account_record.calculated_balance;
        
        -- Check for discrepancies
        IF ABS(calculated_balance - actual_balance) > 0.01 THEN
            discrepancy_count := discrepancy_count + 1;
            RAISE NOTICE 'Account % has balance discrepancy: calculated=%, actual=%', 
                account_record.id, calculated_balance, actual_balance;
        END IF;
    END LOOP;
    
    IF discrepancy_count = 0 THEN
        RAISE NOTICE '✅ All account balances are correct';
    ELSE
        RAISE NOTICE '❌ Found % accounts with balance discrepancies', discrepancy_count;
    END IF;
END $$;

-- Check 2: Verify lend/borrow records have proper account assignments
DO $$
DECLARE
    records_without_accounts INTEGER;
    records_with_accounts INTEGER;
    total_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM lend_borrow;
    SELECT COUNT(*) INTO records_with_accounts FROM lend_borrow WHERE account_id IS NOT NULL;
    SELECT COUNT(*) INTO records_without_accounts FROM lend_borrow WHERE account_id IS NULL;
    
    RAISE NOTICE 'Lend/borrow records:';
    RAISE NOTICE 'Total: %', total_records;
    RAISE NOTICE 'With accounts: %', records_with_accounts;
    RAISE NOTICE 'Without accounts: %', records_without_accounts;
    
    IF records_without_accounts = 0 THEN
        RAISE NOTICE '✅ All records have accounts assigned';
    ELSE
        RAISE NOTICE '⚠️  % records without accounts (standalone records)', records_without_accounts;
    END IF;
END $$;

-- Check 3: Verify transaction creation
DO $$
DECLARE
    lend_borrow_transactions INTEGER;
    expected_transactions INTEGER;
    records_affecting_balance INTEGER;
BEGIN
    SELECT COUNT(*) INTO lend_borrow_transactions 
    FROM transactions WHERE 'lend_borrow' = ANY(tags);
    
    SELECT COUNT(*) INTO records_affecting_balance 
    FROM lend_borrow WHERE affect_account_balance = TRUE;
    
    -- Each record affecting balance should have at least one transaction
    expected_transactions := records_affecting_balance;
    
    RAISE NOTICE 'Transaction creation:';
    RAISE NOTICE 'Lend/borrow transactions: %', lend_borrow_transactions;
    RAISE NOTICE 'Records affecting balance: %', records_affecting_balance;
    RAISE NOTICE 'Expected transactions: %', expected_transactions;
    
    IF lend_borrow_transactions >= expected_transactions THEN
        RAISE NOTICE '✅ Transaction creation is working correctly';
    ELSE
        RAISE NOTICE '❌ Missing transactions for some records';
    END IF;
END $$;

-- Check 4: Verify trigger functionality
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
    
    RAISE NOTICE 'Trigger status:';
    RAISE NOTICE 'Active triggers: %', trigger_count;
    
    IF trigger_count = 3 THEN
        RAISE NOTICE '✅ All triggers are active';
    ELSE
        RAISE NOTICE '❌ Some triggers are missing';
    END IF;
END $$;

-- Check 5: Verify function existence
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
    
    RAISE NOTICE 'Function status:';
    RAISE NOTICE 'Active functions: %', function_count;
    
    IF function_count = 3 THEN
        RAISE NOTICE '✅ All functions are active';
    ELSE
        RAISE NOTICE '❌ Some functions are missing';
    END IF;
END $$;

-- Final status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Data integrity verification completed!';
    RAISE NOTICE 'If all checks passed, the integration is working correctly.';
    RAISE NOTICE 'If any checks failed, review the error messages above.';
    RAISE NOTICE 'Run rollback scripts if needed.';
END $$;
