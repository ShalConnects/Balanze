-- Fix title sync between purchases and transactions
-- The issue is that purchase.item_name should sync to transaction.description

-- First, let's check the current sync function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_purchase_to_transaction';

-- Drop and recreate the sync function to ensure title sync works
DROP FUNCTION IF EXISTS sync_purchase_to_transaction();

CREATE OR REPLACE FUNCTION sync_purchase_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the linked transaction with purchase data
    UPDATE transactions 
    SET 
        amount = NEW.price,
        description = NEW.item_name,  -- This maps purchase title to transaction description
        updated_at = NOW()
    WHERE transaction_id = NEW.transaction_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_sync_purchase_to_transaction ON purchases;
CREATE TRIGGER trigger_sync_purchase_to_transaction
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION sync_purchase_to_transaction();

-- Test the sync manually for existing data
UPDATE purchases 
SET item_name = item_name || ' (SYNC TEST)'
WHERE transaction_id IN (
    SELECT transaction_id FROM transactions LIMIT 1
);

-- Check if the sync worked
SELECT 
    p.transaction_id,
    p.item_name as purchase_title,
    t.description as transaction_description
FROM purchases p
JOIN transactions t ON p.transaction_id = t.transaction_id
LIMIT 5; 