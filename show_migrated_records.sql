-- Show Migrated Lend & Borrow Records
-- This script displays all records that were migrated with their details

-- 1. Migrated Records Overview
SELECT 
    'MIGRATED_RECORDS_OVERVIEW' as section,
    COUNT(*) as total_migrated,
    COUNT(CASE WHEN lb.type = 'lend' THEN 1 END) as lend_records,
    COUNT(CASE WHEN lb.type = 'borrow' THEN 1 END) as borrow_records,
    COUNT(CASE WHEN lb.status = 'active' THEN 1 END) as active_records,
    COUNT(CASE WHEN lb.status = 'settled' THEN 1 END) as settled_records,
    SUM(lb.amount) as total_amount_migrated
FROM lend_borrow lb
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
AND lb.transaction_id LIKE 'LB%';

-- 2. Detailed Migrated Records
SELECT 
    'MIGRATED_RECORD_DETAILS' as section,
    lb.id as record_id,
    lb.type as record_type,
    lb.person_name,
    lb.amount,
    lb.currency,
    lb.status,
    lb.transaction_id,
    lb.account_id,
    a.name as account_name,
    lb.due_date,
    lb.created_at as record_created,
    lb.updated_at as record_updated,
    t.created_at as transaction_created,
    t.description as transaction_description,
    t.type as transaction_type,
    CASE 
        WHEN lb.transaction_id LIKE 'LB%' THEN 'MIGRATED'
        ELSE 'EXISTING'
    END as migration_status
FROM lend_borrow lb
JOIN accounts a ON lb.account_id = a.id
JOIN transactions t ON lb.transaction_id = t.transaction_id
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
ORDER BY lb.created_at DESC;

-- 3. Migration Timeline (Recent Migrations)
SELECT 
    'RECENT_MIGRATIONS' as section,
    lb.person_name,
    lb.type,
    lb.amount,
    lb.currency,
    lb.transaction_id,
    t.created_at as migration_time,
    t.description
FROM lend_borrow lb
JOIN transactions t ON lb.transaction_id = t.transaction_id
WHERE lb.transaction_id LIKE 'LB%'
AND t.tags @> ARRAY['migrated']
ORDER BY t.created_at DESC;

-- 4. Records by Account
SELECT 
    'RECORDS_BY_ACCOUNT' as section,
    a.name as account_name,
    a.currency,
    COUNT(lb.id) as total_records,
    COUNT(CASE WHEN lb.type = 'lend' THEN 1 END) as lend_count,
    COUNT(CASE WHEN lb.type = 'borrow' THEN 1 END) as borrow_count,
    SUM(lb.amount) as total_amount,
    COUNT(CASE WHEN lb.status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN lb.status = 'settled' THEN 1 END) as settled_count
FROM lend_borrow lb
JOIN accounts a ON lb.account_id = a.id
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
GROUP BY a.id, a.name, a.currency
ORDER BY total_records DESC;

-- 5. Currency Distribution of Migrated Records
SELECT 
    'CURRENCY_DISTRIBUTION' as section,
    lb.currency,
    COUNT(*) as record_count,
    SUM(lb.amount) as total_amount,
    AVG(lb.amount) as average_amount,
    MIN(lb.amount) as min_amount,
    MAX(lb.amount) as max_amount
FROM lend_borrow lb
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
GROUP BY lb.currency
ORDER BY record_count DESC;

-- 6. User Distribution of Migrated Records
SELECT 
    'USER_DISTRIBUTION' as section,
    lb.user_id,
    COUNT(*) as total_records,
    COUNT(CASE WHEN lb.type = 'lend' THEN 1 END) as lend_records,
    COUNT(CASE WHEN lb.type = 'borrow' THEN 1 END) as borrow_records,
    SUM(lb.amount) as total_amount,
    COUNT(CASE WHEN lb.status = 'active' THEN 1 END) as active_records,
    COUNT(CASE WHEN lb.status = 'settled' THEN 1 END) as settled_records
FROM lend_borrow lb
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
GROUP BY lb.user_id
ORDER BY total_records DESC;

-- 7. Migration Verification - Check for any inconsistencies
SELECT 
    'MIGRATION_VERIFICATION' as section,
    'Records with transaction_id but no matching transaction' as issue,
    COUNT(*) as count
FROM lend_borrow lb
LEFT JOIN transactions t ON lb.transaction_id = t.transaction_id
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
AND t.transaction_id IS NULL

UNION ALL

SELECT 
    'MIGRATION_VERIFICATION' as section,
    'Transactions without matching lend_borrow record' as issue,
    COUNT(*) as count
FROM transactions t
LEFT JOIN lend_borrow lb ON t.transaction_id = lb.transaction_id
WHERE t.category = 'Lend/Borrow'
AND t.tags @> ARRAY['migrated']
AND lb.transaction_id IS NULL;

-- 8. Summary of What Was Migrated
SELECT 
    'MIGRATION_SUMMARY' as section,
    'Total records migrated' as description,
    COUNT(*) as count
FROM lend_borrow lb
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
AND lb.transaction_id LIKE 'LB%'

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as section,
    'Total transactions created' as description,
    COUNT(*) as count
FROM transactions t
WHERE t.category = 'Lend/Borrow'
AND t.tags @> ARRAY['migrated']

UNION ALL

SELECT 
    'MIGRATION_SUMMARY' as section,
    'Total amount migrated' as description,
    SUM(lb.amount) as count
FROM lend_borrow lb
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
AND lb.transaction_id LIKE 'LB%';
