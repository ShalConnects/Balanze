-- Find potential matching transactions for the specified purchases
-- This helps identify transactions that might be linked to these purchases

SELECT 
    p.id AS purchase_id,
    p.item_name AS purchase_item,
    p.user_id AS purchase_user_id,
    p.category AS purchase_category,
    p.price AS purchase_price,
    p.purchase_date,
    p.status AS purchase_status,
    p.exclude_from_calculation,
    t.id AS potential_transaction_id,
    t.transaction_id AS transaction_formatted_id,
    t.description AS transaction_description,
    t.amount AS transaction_amount,
    t.category AS transaction_category,
    t.date AS transaction_date,
    t.user_id AS transaction_user_id,
    t.created_at AS transaction_created_at,
    CASE 
        WHEN t.id IS NULL THEN 'NO MATCHING TRANSACTION FOUND'
        WHEN p.user_id = t.user_id 
             AND ABS(EXTRACT(EPOCH FROM (p.purchase_date::timestamp - t.date::timestamp))) <= 86400 * 7 -- within 7 days
             AND ABS(p.price - t.amount) <= 1 -- amount within $1
             AND (p.category = t.category OR t.category IS NULL)
        THEN 'STRONG MATCH'
        WHEN p.user_id = t.user_id 
             AND ABS(EXTRACT(EPOCH FROM (p.purchase_date::timestamp - t.date::timestamp))) <= 86400 * 30 -- within 30 days
             AND ABS(p.price - t.amount) <= 100 -- amount within $100
        THEN 'POSSIBLE MATCH'
        ELSE 'WEAK MATCH'
    END AS match_quality
FROM purchases p
LEFT JOIN transactions t ON (
    p.user_id = t.user_id
    AND ABS(EXTRACT(EPOCH FROM (p.purchase_date::timestamp - t.date::timestamp))) <= 86400 * 30 -- within 30 days
    AND ABS(p.price - t.amount) <= 500 -- amount within $500
    AND t.transaction_id IS NULL -- only transactions missing transaction_id
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
ORDER BY 
    CASE 
        WHEN t.id IS NULL THEN 4
        WHEN p.user_id = t.user_id 
             AND ABS(EXTRACT(EPOCH FROM (p.purchase_date::timestamp - t.date::timestamp))) <= 86400 * 7
             AND ABS(p.price - t.amount) <= 1
             AND (p.category = t.category OR t.category IS NULL)
        THEN 1
        WHEN p.user_id = t.user_id 
             AND ABS(EXTRACT(EPOCH FROM (p.purchase_date::timestamp - t.date::timestamp))) <= 86400 * 30
             AND ABS(p.price - t.amount) <= 100
        THEN 2
        ELSE 3
    END,
    p.purchase_date DESC;
