-- Check Transfer Transaction Dates
-- This script will help identify if the issue is with the database data or the frontend display

-- Check regular transfers (transactions with transfer tags)
SELECT '=== REGULAR TRANSFERS ===' as info;

SELECT 
    id,
    transaction_id,
    type,
    amount,
    date,
    created_at,
    updated_at,
    note,
    tags
FROM transactions 
WHERE tags @> ARRAY['transfer']
ORDER BY date DESC
LIMIT 10;

-- Check DPS transfers
SELECT '=== DPS TRANSFERS ===' as info;

SELECT 
    id,
    transaction_id,
    amount,
    date,
    created_at,
    updated_at,
    note
FROM dps_transfers 
ORDER BY date DESC
LIMIT 10;

-- Check if there are any transactions with NULL dates
SELECT '=== NULL DATE CHECK ===' as info;

SELECT 
    'transactions' as table_name,
    COUNT(*) as total_records,
    COUNT(date) as records_with_date,
    COUNT(*) - COUNT(date) as records_without_date
FROM transactions 
WHERE tags @> ARRAY['transfer']

UNION ALL

SELECT 
    'dps_transfers' as table_name,
    COUNT(*) as total_records,
    COUNT(date) as records_with_date,
    COUNT(*) - COUNT(date) as records_without_date
FROM dps_transfers;

-- Check the most recent transfer dates
SELECT '=== MOST RECENT TRANSFER DATES ===' as info;

SELECT 
    'transactions' as source,
    date,
    created_at,
    updated_at,
    note
FROM transactions 
WHERE tags @> ARRAY['transfer']
ORDER BY date DESC
LIMIT 5

UNION ALL

SELECT 
    'dps_transfers' as source,
    date,
    created_at,
    updated_at,
    note
FROM dps_transfers 
ORDER BY date DESC
LIMIT 5

ORDER BY date DESC; 