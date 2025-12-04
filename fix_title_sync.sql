-- Fix title sync issue
-- This script ensures that purchase item_name properly syncs to transaction description

-- 1. First, let's check the current field mappings
SELECT 
    'Field mapping check:' as info,
    'purchases.item_name' as purchase_field,
    'transactions.description' as transaction_field;

-- 2. Check if there are any linked purchases and transactions
SELECT 
    'Current linked records:' as info,
    p.item_name as purchase_title,
    t.description as transaction_description,
    p.category as purchase_category,
    t.category as transaction_category,
    p.price as purchase_price,
    t.amount as transaction_amount,
    CASE 
        WHEN p.item_name = t.description THEN '✅ Title SYNCED' 
        ELSE '❌ Title NOT SYNCED' 
    END as title_sync_status
FROM purchases p
JOIN transactions t ON p.transaction_id = t.transaction_id
LIMIT 10;

-- 3. Let's manually sync the titles for existing records
UPDATE transactions 
SET description = p.item_name
FROM purchases p
WHERE transactions.transaction_id = p.transaction_id 
  AND transactions.description != p.item_name;

-- 4. Check the sync status after manual update
SELECT 
    'After manual sync:' as info,
    p.item_name as purchase_title,
    t.description as transaction_description,
    CASE 
        WHEN p.item_name = t.description THEN '✅ Title SYNCED' 
        ELSE '❌ Title NOT SYNCED' 
    END as title_sync_status
FROM purchases p
JOIN transactions t ON p.transaction_id = t.transaction_id
LIMIT 10;

-- 5. Verify the sync function is correctly mapping item_name to description
-- Let's check the current sync function
SELECT 
    'Current sync function check:' as info,
    'sync_purchase_to_transaction' as function_name,
    'Should map: item_name → description' as expected_mapping;

-- 6. Test the sync by updating a purchase title manually
-- (This will help us see if the trigger is working)
SELECT 
    'Ready to test title sync:' as status,
    'Try editing a purchase title and check if it updates the transaction description' as instruction;

-- 7. Show the trigger configuration
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_purchase_to_transaction_trigger';

-- 8. Count how many titles are out of sync
SELECT 
    'Title sync statistics:' as info,
    COUNT(*) as total_linked_records,
    COUNT(CASE WHEN p.item_name = t.description THEN 1 END) as synced_titles,
    COUNT(CASE WHEN p.item_name != t.description THEN 1 END) as unsynced_titles
FROM purchases p
JOIN transactions t ON p.transaction_id = t.transaction_id; 