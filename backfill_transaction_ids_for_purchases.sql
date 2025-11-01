-- Backfill transaction_id for transactions linked to specific purchases
-- This script generates F format transaction_id (F1234567) for transactions that are missing it
-- It only updates transactions that are linked via UUID (not changing anything else)

-- Step 1: Preview - Check which transactions need backfilling (linked to the purchases via UUID)
-- Run this first to see what will be updated
WITH valid_uuid_purchases AS (
    SELECT *
    FROM purchases
    WHERE transaction_id IS NOT NULL
      AND transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND NOT transaction_id ~ '^F[0-9]+$'
      AND id IN (
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
)
SELECT 
    t.id AS transaction_id_uuid,
    t.transaction_id AS current_transaction_id,
    t.description,
    t.amount,
    t.category,
    t.date,
    t.created_at,
    p.id AS purchase_id,
    p.item_name,
    p.category AS purchase_category,
    p.transaction_id AS purchase_transaction_id,
    'NEEDS BACKFILL' AS status
FROM transactions t
INNER JOIN valid_uuid_purchases p ON p.transaction_id::uuid = t.id
WHERE t.transaction_id IS NULL;

-- Step 2: Backfill transaction_id for transactions that need it
-- This generates F format transaction_id (F + 7 digits) for transactions missing it
-- Only updates transactions linked via UUID (preserves all other data)
UPDATE transactions t
SET transaction_id = 'F' || LPAD(FLOOR(RANDOM() * 10000000)::text, 7, '0')
FROM purchases p
WHERE p.transaction_id IS NOT NULL
  AND p.transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND NOT p.transaction_id ~ '^F[0-9]+$'
  AND p.transaction_id::uuid = t.id
  AND t.transaction_id IS NULL
  AND p.id IN (
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
RETURNING 
    t.id AS transaction_id_uuid,
    t.transaction_id AS new_transaction_id,
    t.description,
    t.amount,
    t.category,
    p.id AS purchase_id,
    p.item_name;

-- Step 3: Verify the update
WITH valid_uuid_purchases AS (
    SELECT *
    FROM purchases
    WHERE transaction_id IS NOT NULL
      AND transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND NOT transaction_id ~ '^F[0-9]+$'
      AND id IN (
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
)
SELECT 
    t.id AS transaction_id_uuid,
    t.transaction_id AS transaction_id_formatted,
    t.description,
    t.amount,
    t.category,
    p.id AS purchase_id,
    p.item_name,
    'BACKFILLED' AS status
FROM transactions t
INNER JOIN valid_uuid_purchases p ON p.transaction_id::uuid = t.id
WHERE t.transaction_id IS NOT NULL
ORDER BY t.created_at DESC;
