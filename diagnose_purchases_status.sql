-- Diagnostic query to check the status of the specified purchases
-- This will help understand why the backfill didn't update anything

SELECT 
    p.id AS purchase_id,
    p.item_name,
    p.user_id,
    p.category,
    p.price,
    p.status,
    p.exclude_from_calculation,
    p.transaction_id AS purchase_transaction_id,
    CASE 
        WHEN p.transaction_id IS NULL THEN 'NO TRANSACTION LINK'
        WHEN p.transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID FORMAT'
        WHEN p.transaction_id ~ '^F[0-9]+$' THEN 'F FORMAT ID'
        ELSE 'UNKNOWN FORMAT'
    END AS purchase_transaction_id_type,
    t.id AS transaction_uuid,
    t.transaction_id AS transaction_formatted_id,
    CASE 
        WHEN t.id IS NULL AND p.transaction_id IS NOT NULL AND p.transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'BROKEN LINK - Transaction not found'
        WHEN t.id IS NOT NULL AND t.transaction_id IS NULL THEN 'NEEDS BACKFILL'
        WHEN t.id IS NOT NULL AND t.transaction_id IS NOT NULL THEN 'ALREADY HAS TRANSACTION_ID'
        ELSE 'NO LINK'
    END AS link_status
FROM purchases p
LEFT JOIN transactions t ON (
    CASE 
        WHEN p.transaction_id IS NOT NULL 
             AND p.transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             AND NOT p.transaction_id ~ '^F[0-9]+$'
        THEN p.transaction_id::uuid = t.id
        ELSE FALSE
    END
)
WHERE p.id IN (
    'c44116ef-5b39-46a6-b43f-48ebbc8aee2a',
    'a16a2e6b-d136-4c42-bae9-5cbd0b5e6de3',
    'b2b1dcad-f0e6-45a1-8806-25310dcc92a8',
    '1d8e4afc-f4e8-42a3-9d2e-d75bd07f70d1',
    'a62ac063-8f61-464c-a48f-87bc03f03950',
    '6dc7dbe9-f571-45bc-ad94-4cfe167ed837',
    'a2c561bc-a24e-41e1-a47e-338e4b8c6e89',
    '9e20ada6-0c46-4fc6-8cc9-993fb61b4f34',
    '2380d2a5-55bb-4435-8065-9880d2b9e873',
    '38ae9ead-e8ec-4424-a09c-5cfedf709f06',
    'f1189d33-c9bf-41e9-9d3f-712fd3bebf3e',
    '4b74e47d-6184-4d0b-92e2-d55dc4fb5346',
    'a058005a-f5e7-4ee0-aa2c-99e947c677b3'
)
ORDER BY p.created_at DESC;
