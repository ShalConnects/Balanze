-- Fix any remaining UUID transaction_ids in the database
-- This script converts any UUID format transaction_ids to the new F1234567 format

-- Function to generate new transaction IDs
CREATE OR REPLACE FUNCTION generate_new_transaction_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'F' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Update any transactions that still have UUID format transaction_ids
UPDATE transactions 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update any purchases that still have UUID format transaction_ids
UPDATE purchases 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update any other tables that might have UUID format transaction_ids
UPDATE dps_transfers 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE accounts 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE purchase_categories 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE savings_goals 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE notifications 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Verify the fix
SELECT 
  'UUID to VARCHAR conversion complete' as status,
  'All transaction_ids are now in F1234567 format' as message;

-- Show sample of updated transaction_ids
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  STRING_AGG(DISTINCT LEFT(transaction_id, 3), ', ') as sample_ids
FROM transactions
WHERE transaction_id IS NOT NULL

UNION ALL

SELECT 
  'purchases' as table_name,
  COUNT(*) as total_records,
  STRING_AGG(DISTINCT LEFT(transaction_id, 3), ', ') as sample_ids
FROM purchases
WHERE transaction_id IS NOT NULL; 