-- Find all linked purchase-transaction records for all users
-- This query shows purchases that are linked to transactions

WITH valid_uuid_purchases AS (
    SELECT *
    FROM purchases
    WHERE transaction_id IS NOT NULL 
      AND transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
SELECT 
    p.id AS purchase_id,
    p.user_id,
    p.item_name,
    p.category AS purchase_category,
    p.price AS purchase_price,
    p.purchase_date,
    p.status,
    p.priority,
    p.created_at AS purchase_created_at,
    p.transaction_id AS purchase_transaction_id_uuid,
    t.id AS transaction_id_uuid,
    t.transaction_id AS transaction_id_formatted, -- F format (F1234567)
    t.description AS transaction_description,
    t.amount AS transaction_amount,
    t.category AS transaction_category,
    t.type AS transaction_type,
    t.account_id,
    t.date AS transaction_date,
    t.created_at AS transaction_created_at,
    t.updated_at AS transaction_updated_at,
    CASE 
        WHEN p.transaction_id IS NOT NULL AND p.transaction_id ~ '^F[0-9]+$' THEN 'F FORMAT ID - Not linked via UUID'
        WHEN p.transaction_id IS NOT NULL AND t.id IS NULL THEN 'BROKEN LINK - Transaction not found'
        WHEN t.id IS NOT NULL AND t.transaction_id IS NULL THEN 'MISSING TRANSACTION_ID - Needs backfill'
        WHEN t.id IS NOT NULL THEN 'LINKED OK'
        ELSE 'NO LINK'
    END AS link_status
FROM purchases p
LEFT JOIN valid_uuid_purchases vup ON p.id = vup.id
LEFT JOIN transactions t ON vup.transaction_id::uuid = t.id
ORDER BY p.created_at DESC;

-- Summary statistics
WITH valid_uuid_purchases AS (
    SELECT *
    FROM purchases
    WHERE transaction_id IS NOT NULL 
      AND transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
SELECT 
    COUNT(*) AS total_purchases,
    COUNT(p.transaction_id) AS purchases_with_transaction_id,
    COUNT(CASE WHEN p.transaction_id ~ '^F[0-9]+$' THEN 1 END) AS purchases_with_f_format_id,
    COUNT(CASE WHEN p.transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) AS purchases_with_uuid_format,
    COUNT(t.id) AS successfully_linked_purchases,
    COUNT(CASE WHEN vup.id IS NOT NULL AND t.id IS NULL THEN 1 END) AS broken_links,
    COUNT(CASE WHEN t.id IS NOT NULL AND t.transaction_id IS NULL THEN 1 END) AS linked_but_missing_transaction_id,
    COUNT(CASE WHEN t.id IS NOT NULL AND t.transaction_id IS NOT NULL THEN 1 END) AS fully_linked_with_transaction_id
FROM purchases p
LEFT JOIN valid_uuid_purchases vup ON p.id = vup.id
LEFT JOIN transactions t ON vup.transaction_id::uuid = t.id;

-- Broken links (purchases pointing to non-existent transactions)
WITH valid_uuid_purchases AS (
    SELECT *
    FROM purchases
    WHERE transaction_id IS NOT NULL 
      AND transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
SELECT 
    p.id AS purchase_id,
    p.user_id,
    p.item_name,
    p.category,
    p.price,
    p.purchase_date,
    p.transaction_id AS missing_transaction_id
FROM purchases p
INNER JOIN valid_uuid_purchases vup ON p.id = vup.id
LEFT JOIN transactions t ON vup.transaction_id::uuid = t.id
WHERE t.id IS NULL
ORDER BY p.created_at DESC;

-- Purchases with F format transaction_id (these need different linking logic)
SELECT 
    p.id AS purchase_id,
    p.user_id,
    p.item_name,
    p.category,
    p.price,
    p.purchase_date,
    p.transaction_id AS f_format_transaction_id
FROM purchases p
WHERE p.transaction_id IS NOT NULL 
  AND p.transaction_id ~ '^F[0-9]+$'
ORDER BY p.created_at DESC;

-- Purchases without any transaction link
SELECT 
    p.id AS purchase_id,
    p.user_id,
    p.item_name,
    p.category,
    p.price,
    p.purchase_date,
    p.status,
    p.exclude_from_calculation
FROM purchases p
WHERE p.transaction_id IS NULL
ORDER BY p.created_at DESC;
