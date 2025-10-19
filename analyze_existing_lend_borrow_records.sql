-- Comprehensive Analysis of Existing Lend & Borrow Records
-- This script analyzes all lend/borrow data to understand current state before migration

-- 1. Basic Lend & Borrow Records Overview
SELECT 
    'LEND_BORROW_RECORDS' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN account_id IS NOT NULL THEN 1 END) as account_linked_records,
    COUNT(CASE WHEN account_id IS NULL THEN 1 END) as record_only_records,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_records,
    COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_records,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_records,
    COUNT(CASE WHEN transaction_id IS NOT NULL THEN 1 END) as records_with_transaction_id,
    COUNT(CASE WHEN transaction_id IS NULL THEN 1 END) as records_without_transaction_id
FROM lend_borrow;

-- 2. Detailed Lend & Borrow Records Analysis
SELECT 
    id,
    user_id,
    type,
    person_name,
    amount,
    currency,
    status,
    account_id,
    transaction_id,
    affect_account_balance,
    due_date,
    created_at,
    updated_at,
    CASE 
        WHEN account_id IS NOT NULL THEN 'Account-Linked'
        WHEN account_id IS NULL THEN 'Record-Only'
    END as record_type,
    CASE 
        WHEN transaction_id IS NOT NULL THEN 'Has Transaction ID'
        WHEN transaction_id IS NULL THEN 'No Transaction ID'
    END as transaction_status
FROM lend_borrow
ORDER BY created_at DESC;

-- 3. Partial Returns/Payments Analysis
SELECT 
    'PARTIAL_RETURNS' as table_name,
    COUNT(*) as total_partial_returns,
    COUNT(CASE WHEN account_id IS NOT NULL THEN 1 END) as returns_with_account,
    COUNT(CASE WHEN account_id IS NULL THEN 1 END) as returns_without_account,
    SUM(amount) as total_partial_amount,
    AVG(amount) as average_partial_amount
FROM lend_borrow_returns;

-- 4. Detailed Partial Returns Analysis
SELECT 
    lbr.id,
    lbr.lend_borrow_id,
    lb.person_name,
    lb.type as original_type,
    lbr.amount,
    lbr.return_date,
    lbr.account_id,
    lbr.created_at,
    CASE 
        WHEN lbr.account_id IS NOT NULL THEN 'Has Account'
        WHEN lbr.account_id IS NULL THEN 'No Account'
    END as account_status
FROM lend_borrow_returns lbr
JOIN lend_borrow lb ON lbr.lend_borrow_id = lb.id
ORDER BY lbr.created_at DESC;

-- 5. Associated Transactions Analysis
SELECT 
    'ASSOCIATED_TRANSACTIONS' as table_name,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN category = 'Lend/Borrow' THEN 1 END) as lend_borrow_transactions,
    SUM(amount) as total_transaction_amount,
    COUNT(DISTINCT account_id) as unique_accounts_affected
FROM transactions t
WHERE t.transaction_id IN (
    SELECT DISTINCT transaction_id 
    FROM lend_borrow 
    WHERE transaction_id IS NOT NULL
);

-- 6. Detailed Associated Transactions
SELECT 
    t.id,
    t.transaction_id,
    t.account_id,
    t.type,
    t.amount,
    t.description,
    t.category,
    t.date,
    t.tags,
    lb.person_name,
    lb.type as lend_borrow_type,
    lb.status as lend_borrow_status
FROM transactions t
JOIN lend_borrow lb ON t.transaction_id = lb.transaction_id
WHERE lb.transaction_id IS NOT NULL
ORDER BY t.created_at DESC;

-- 7. Account Balance Impact Analysis
SELECT 
    a.id as account_id,
    a.name as account_name,
    a.currency,
    a.calculated_balance,
    COUNT(lb.id) as total_lend_borrow_records,
    COUNT(CASE WHEN lb.type = 'lend' THEN 1 END) as lend_records,
    COUNT(CASE WHEN lb.type = 'borrow' THEN 1 END) as borrow_records,
    COUNT(CASE WHEN lb.status = 'active' THEN 1 END) as active_records,
    COUNT(CASE WHEN lb.status = 'settled' THEN 1 END) as settled_records
FROM accounts a
LEFT JOIN lend_borrow lb ON a.id = lb.account_id
WHERE lb.account_id IS NOT NULL
GROUP BY a.id, a.name, a.currency, a.calculated_balance
ORDER BY total_lend_borrow_records DESC;

-- 8. Data Integrity Issues
SELECT 
    'DATA_INTEGRITY_ISSUES' as issue_type,
    COUNT(*) as count,
    'Records with account_id but no transaction_id' as description
FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NULL

UNION ALL

SELECT 
    'DATA_INTEGRITY_ISSUES' as issue_type,
    COUNT(*) as count,
    'Records with transaction_id but no account_id' as description
FROM lend_borrow 
WHERE transaction_id IS NOT NULL AND account_id IS NULL

UNION ALL

SELECT 
    'DATA_INTEGRITY_ISSUES' as issue_type,
    COUNT(*) as count,
    'Partial returns without account_id' as description
FROM lend_borrow_returns 
WHERE account_id IS NULL

UNION ALL

SELECT 
    'DATA_INTEGRITY_ISSUES' as issue_type,
    COUNT(*) as count,
    'Orphaned transactions (no matching lend_borrow record)' as description
FROM transactions t
WHERE t.category = 'Lend/Borrow' 
AND t.transaction_id NOT IN (
    SELECT DISTINCT transaction_id 
    FROM lend_borrow 
    WHERE transaction_id IS NOT NULL
);

-- 9. Settlement Status Analysis
SELECT 
    status,
    COUNT(*) as record_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM lend_borrow
GROUP BY status
ORDER BY record_count DESC;

-- 10. Currency Distribution
SELECT 
    currency,
    COUNT(*) as record_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM lend_borrow
GROUP BY currency
ORDER BY record_count DESC;

-- 11. User Distribution
SELECT 
    user_id,
    COUNT(*) as total_records,
    COUNT(CASE WHEN type = 'lend' THEN 1 END) as lend_records,
    COUNT(CASE WHEN type = 'borrow' THEN 1 END) as borrow_records,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_records,
    COUNT(CASE WHEN status = 'settled' THEN 1 END) as settled_records,
    SUM(amount) as total_amount
FROM lend_borrow
GROUP BY user_id
ORDER BY total_records DESC;

-- 12. Recent Activity (Last 30 days)
SELECT 
    'RECENT_ACTIVITY' as activity_type,
    COUNT(*) as count,
    'New lend/borrow records' as description
FROM lend_borrow 
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'RECENT_ACTIVITY' as activity_type,
    COUNT(*) as count,
    'New partial returns' as description
FROM lend_borrow_returns 
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'RECENT_ACTIVITY' as activity_type,
    COUNT(*) as count,
    'Settled records' as description
FROM lend_borrow 
WHERE status = 'settled' 
AND updated_at >= NOW() - INTERVAL '30 days';

-- 13. Migration Readiness Check
SELECT 
    'MIGRATION_READINESS' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'READY'
        ELSE 'NEEDS_ATTENTION'
    END as status,
    'Records without transaction_id that need migration' as description,
    COUNT(*) as count
FROM lend_borrow 
WHERE account_id IS NOT NULL AND transaction_id IS NULL;
