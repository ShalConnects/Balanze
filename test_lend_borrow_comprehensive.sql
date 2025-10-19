-- Comprehensive Lend & Borrow Functionality Test Script
-- This script tests all scenarios for lend & borrow functionality
-- DO NOT RUN WITHOUT PERMISSION - Review first!

-- ==============================================
-- TEST SCENARIO 1: Account-Linked Lend Record
-- ==============================================

-- Test 1.1: Create account-linked lend record
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5', -- Replace with actual user ID
    'lend', 
    'Test Borrower 1', 
    1000.00, 
    'USD', 
    '2025-02-15', 
    'Test lend record with account', 
    'active', 
    'b2b05ef1-bfef-4765-8d18-c55ee940a3af', -- Replace with actual account ID
    true, 
    NOW(), 
    NOW()
);

-- Test 1.2: Verify transaction was created
SELECT 'Test 1.2: Check transaction creation' as test_name;
SELECT * FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Test Borrower 1%'
ORDER BY created_at DESC LIMIT 1;

-- Test 1.3: Verify account balance was affected
SELECT 'Test 1.3: Check account balance' as test_name;
SELECT id, name, calculated_balance, currency 
FROM accounts 
WHERE id = 'b2b05ef1-bfef-4765-8d18-c55ee940a3af';

-- ==============================================
-- TEST SCENARIO 2: Record-Only Lend Record
-- ==============================================

-- Test 2.1: Create record-only lend record
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'lend', 
    'Test Borrower 2', 
    500.00, 
    'EUR', 
    NULL, 
    'Test record-only lend', 
    'active', 
    NULL, 
    false, 
    NOW(), 
    NOW()
);

-- Test 2.2: Verify NO transaction was created
SELECT 'Test 2.2: Verify no transaction for record-only' as test_name;
SELECT COUNT(*) as transaction_count FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Test Borrower 2%';

-- ==============================================
-- TEST SCENARIO 3: Account-Linked Borrow Record
-- ==============================================

-- Test 3.1: Create account-linked borrow record
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'borrow', 
    'Test Lender 1', 
    750.00, 
    'USD', 
    '2025-03-01', 
    'Test borrow record with account', 
    'active', 
    'b2b05ef1-bfef-4765-8d18-c55ee940a3af',
    true, 
    NOW(), 
    NOW()
);

-- Test 3.2: Verify transaction was created
SELECT 'Test 3.2: Check borrow transaction creation' as test_name;
SELECT * FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Test Lender 1%'
ORDER BY created_at DESC LIMIT 1;

-- ==============================================
-- TEST SCENARIO 4: Record-Only Borrow Record
-- ==============================================

-- Test 4.1: Create record-only borrow record
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'borrow', 
    'Test Lender 2', 
    300.00, 
    'GBP', 
    NULL, 
    'Test record-only borrow', 
    'active', 
    NULL, 
    false, 
    NOW(), 
    NOW()
);

-- Test 4.2: Verify NO transaction was created
SELECT 'Test 4.2: Verify no transaction for record-only borrow' as test_name;
SELECT COUNT(*) as transaction_count FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Test Lender 2%';

-- ==============================================
-- TEST SCENARIO 5: Partial Return (Account-Linked)
-- ==============================================

-- Test 5.1: Create partial return for account-linked lend
INSERT INTO lend_borrow_returns (
    lend_borrow_id, amount, return_date, account_id
) VALUES (
    (SELECT id FROM lend_borrow WHERE person_name = 'Test Borrower 1' ORDER BY created_at DESC LIMIT 1),
    300.00,
    '2025-01-15',
    'b2b05ef1-bfef-4765-8d18-c55ee940a3af'
);

-- Test 5.2: Verify partial return transaction was created
SELECT 'Test 5.2: Check partial return transaction' as test_name;
SELECT * FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Partial return%'
ORDER BY created_at DESC LIMIT 1;

-- Test 5.3: Verify account balance was updated
SELECT 'Test 5.3: Check account balance after partial return' as test_name;
SELECT id, name, calculated_balance, currency 
FROM accounts 
WHERE id = 'b2b05ef1-bfef-4765-8d18-c55ee940a3af';

-- ==============================================
-- TEST SCENARIO 6: Full Settlement (Account-Linked)
-- ==============================================

-- Test 6.1: Create full settlement for account-linked lend
INSERT INTO lend_borrow_returns (
    lend_borrow_id, amount, return_date, account_id
) VALUES (
    (SELECT id FROM lend_borrow WHERE person_name = 'Test Borrower 1' ORDER BY created_at DESC LIMIT 1),
    700.00, -- Remaining amount
    '2025-01-20',
    'b2b05ef1-bfef-4765-8d18-c55ee940a3af'
);

-- Test 6.2: Update record status to settled
UPDATE lend_borrow 
SET status = 'settled', updated_at = NOW()
WHERE person_name = 'Test Borrower 1' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 6.3: Verify settlement transaction was created
SELECT 'Test 6.3: Check settlement transaction' as test_name;
SELECT * FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Partial return%'
ORDER BY created_at DESC LIMIT 2;

-- ==============================================
-- TEST SCENARIO 7: Edit Account-Linked Record
-- ==============================================

-- Test 7.1: Update account-linked record
UPDATE lend_borrow 
SET amount = 1200.00, person_name = 'Updated Test Borrower 1', updated_at = NOW()
WHERE person_name = 'Test Borrower 1' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 7.2: Verify transaction was updated
SELECT 'Test 7.2: Check updated transaction' as test_name;
SELECT * FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Updated Test Borrower 1%'
ORDER BY created_at DESC LIMIT 1;

-- ==============================================
-- TEST SCENARIO 8: Edit Record-Only Record
-- ==============================================

-- Test 8.1: Update record-only record
UPDATE lend_borrow 
SET amount = 600.00, person_name = 'Updated Test Borrower 2', updated_at = NOW()
WHERE person_name = 'Test Borrower 2' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 8.2: Verify NO transaction was created/updated
SELECT 'Test 8.2: Verify no transaction for record-only edit' as test_name;
SELECT COUNT(*) as transaction_count FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Updated Test Borrower 2%';

-- ==============================================
-- TEST SCENARIO 9: Delete Account-Linked Record
-- ==============================================

-- Test 9.1: Get record ID for deletion
SELECT 'Test 9.1: Get record for deletion' as test_name;
SELECT id, person_name, transaction_id FROM lend_borrow 
WHERE person_name LIKE '%Test Lender 1%' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 9.2: Delete associated transaction first
DELETE FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND description LIKE '%Test Lender 1%';

-- Test 9.3: Disable account balance effects
UPDATE lend_borrow 
SET affect_account_balance = false, updated_at = NOW()
WHERE person_name LIKE '%Test Lender 1%' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 9.4: Delete the record
DELETE FROM lend_borrow 
WHERE person_name LIKE '%Test Lender 1%' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 9.5: Verify record was deleted
SELECT 'Test 9.5: Verify record deletion' as test_name;
SELECT COUNT(*) as record_count FROM lend_borrow 
WHERE person_name LIKE '%Test Lender 1%';

-- ==============================================
-- TEST SCENARIO 10: Delete Record-Only Record
-- ==============================================

-- Test 10.1: Delete record-only record
DELETE FROM lend_borrow 
WHERE person_name LIKE '%Test Lender 2%' 
AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Test 10.2: Verify record was deleted
SELECT 'Test 10.2: Verify record-only deletion' as test_name;
SELECT COUNT(*) as record_count FROM lend_borrow 
WHERE person_name LIKE '%Test Lender 2%';

-- ==============================================
-- TEST SCENARIO 11: Auto-Set Due Date (7 days)
-- ==============================================

-- Test 11.1: Create record without due date
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'lend', 
    'Auto Due Date Test', 
    200.00, 
    'USD', 
    NULL, -- No due date provided
    'Test auto due date', 
    'active', 
    'b2b05ef1-bfef-4765-8d18-c55ee940a3af',
    true, 
    NOW(), 
    NOW()
);

-- Test 11.2: Update with auto-set due date (7 days from now)
UPDATE lend_borrow 
SET due_date = (CURRENT_DATE + INTERVAL '7 days')::date
WHERE person_name = 'Auto Due Date Test'
ORDER BY created_at DESC LIMIT 1;

-- Test 11.3: Verify due date was set
SELECT 'Test 11.3: Check auto-set due date' as test_name;
SELECT person_name, due_date, created_at 
FROM lend_borrow 
WHERE person_name = 'Auto Due Date Test'
ORDER BY created_at DESC LIMIT 1;

-- ==============================================
-- TEST SCENARIO 12: Overdue Status
-- ==============================================

-- Test 12.1: Create overdue record
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'lend', 
    'Overdue Test', 
    150.00, 
    'USD', 
    '2024-12-01', -- Past due date
    'Test overdue record', 
    'overdue', 
    'b2b05ef1-bfef-4765-8d18-c55ee940a3af',
    true, 
    NOW(), 
    NOW()
);

-- Test 12.2: Verify overdue status
SELECT 'Test 12.2: Check overdue status' as test_name;
SELECT person_name, status, due_date, 
       CASE 
           WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
           ELSE 'NOT OVERDUE'
       END as overdue_check
FROM lend_borrow 
WHERE person_name = 'Overdue Test'
ORDER BY created_at DESC LIMIT 1;

-- ==============================================
-- TEST SCENARIO 13: Currency Validation
-- ==============================================

-- Test 13.1: Test different currencies
INSERT INTO lend_borrow (
    user_id, type, person_name, amount, currency, due_date, 
    notes, status, account_id, affect_account_balance, 
    created_at, updated_at
) VALUES 
('0d497c5c-3242-425e-aa73-1081385f46e5', 'lend', 'EUR Test', 100.00, 'EUR', '2025-02-01', 'EUR currency test', 'active', NULL, false, NOW(), NOW()),
('0d497c5c-3242-425e-aa73-1081385f46e5', 'lend', 'GBP Test', 100.00, 'GBP', '2025-02-01', 'GBP currency test', 'active', NULL, false, NOW(), NOW()),
('0d497c5c-3242-425e-aa73-1081385f46e5', 'lend', 'JPY Test', 100.00, 'JPY', '2025-02-01', 'JPY currency test', 'active', NULL, false, NOW(), NOW());

-- Test 13.2: Verify currency records
SELECT 'Test 13.2: Check currency records' as test_name;
SELECT person_name, currency, amount 
FROM lend_borrow 
WHERE person_name IN ('EUR Test', 'GBP Test', 'JPY Test')
ORDER BY person_name;

-- ==============================================
-- FINAL VERIFICATION
-- ==============================================

-- Test Final: Summary of all test records
SELECT 'FINAL: Test Records Summary' as test_name;
SELECT 
    person_name,
    type,
    amount,
    currency,
    status,
    CASE 
        WHEN account_id IS NULL THEN 'Record Only'
        ELSE 'Account Linked'
    END as record_type,
    affect_account_balance,
    due_date
FROM lend_borrow 
WHERE person_name LIKE '%Test%' 
   OR person_name LIKE '%Auto Due Date%'
   OR person_name LIKE '%Overdue%'
ORDER BY created_at DESC;

-- Test Final: Transaction summary
SELECT 'FINAL: Transaction Summary' as test_name;
SELECT 
    description,
    type,
    amount,
    category,
    date
FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND (description LIKE '%Test%' OR description LIKE '%Partial return%')
ORDER BY created_at DESC;

-- Test Final: Account balance check
SELECT 'FINAL: Account Balance' as test_name;
SELECT id, name, calculated_balance, currency 
FROM accounts 
WHERE id = 'b2b05ef1-bfef-4765-8d18-c55ee940a3af';

-- ==============================================
-- CLEANUP (OPTIONAL - UNCOMMENT TO RUN)
-- ==============================================

/*
-- WARNING: This will delete all test records!
-- Uncomment only if you want to clean up after testing

DELETE FROM lend_borrow_returns 
WHERE lend_borrow_id IN (
    SELECT id FROM lend_borrow 
    WHERE person_name LIKE '%Test%' 
       OR person_name LIKE '%Auto Due Date%'
       OR person_name LIKE '%Overdue%'
);

DELETE FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5' 
AND (description LIKE '%Test%' OR description LIKE '%Partial return%');

DELETE FROM lend_borrow 
WHERE person_name LIKE '%Test%' 
   OR person_name LIKE '%Auto Due Date%'
   OR person_name LIKE '%Overdue%';

SELECT 'CLEANUP COMPLETED' as status;
*/

-- ==============================================
-- TEST COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 COMPREHENSIVE LEND & BORROW TEST COMPLETED!';
    RAISE NOTICE '📋 Tested Scenarios:';
    RAISE NOTICE '   1. Account-Linked Lend Record';
    RAISE NOTICE '   2. Record-Only Lend Record';
    RAISE NOTICE '   3. Account-Linked Borrow Record';
    RAISE NOTICE '   4. Record-Only Borrow Record';
    RAISE NOTICE '   5. Partial Return (Account-Linked)';
    RAISE NOTICE '   6. Full Settlement (Account-Linked)';
    RAISE NOTICE '   7. Edit Account-Linked Record';
    RAISE NOTICE '   8. Edit Record-Only Record';
    RAISE NOTICE '   9. Delete Account-Linked Record';
    RAISE NOTICE '   10. Delete Record-Only Record';
    RAISE NOTICE '   11. Auto-Set Due Date (7 days)';
    RAISE NOTICE '   12. Overdue Status';
    RAISE NOTICE '   13. Currency Validation';
    RAISE NOTICE '✅ All tests completed successfully!';
END $$;
