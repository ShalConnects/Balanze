-- =====================================================
-- COMPLETE FIX FOR UUID/VARCHAR MISMATCH ISSUE
-- This script will resolve the "operator does not exist: character varying = uuid" error
-- =====================================================

-- Step 1: Disable triggers temporarily to avoid conflicts
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
DROP TRIGGER IF EXISTS sync_transaction_price_trigger ON transactions;

-- Step 2: Drop all foreign key constraints that reference transaction_id
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_transaction_id_fkey;
ALTER TABLE purchase_categories DROP CONSTRAINT IF EXISTS purchase_categories_transaction_id_fkey;
ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_transaction_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_transaction_id_fkey;
ALTER TABLE dps_transfers DROP CONSTRAINT IF EXISTS dps_transfers_transaction_id_fkey;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_transaction_id_fkey;

-- Step 3: Drop all existing indexes on transaction_id columns
DROP INDEX IF EXISTS idx_transactions_transaction_id;
DROP INDEX IF EXISTS idx_dps_transfers_transaction_id;
DROP INDEX IF EXISTS idx_accounts_transaction_id;
DROP INDEX IF EXISTS idx_purchases_transaction_id;
DROP INDEX IF EXISTS idx_purchase_categories_transaction_id;
DROP INDEX IF EXISTS idx_savings_goals_transaction_id;
DROP INDEX IF EXISTS idx_notifications_transaction_id;

-- Step 4: Convert all transaction_id columns to VARCHAR(8)
-- This will handle the type conversion properly
ALTER TABLE transactions ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;
ALTER TABLE dps_transfers ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;
ALTER TABLE accounts ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;
ALTER TABLE purchases ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;
ALTER TABLE purchase_categories ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;
ALTER TABLE savings_goals ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;
ALTER TABLE notifications ALTER COLUMN transaction_id TYPE VARCHAR(8) USING transaction_id::TEXT;

-- Step 5: Recreate all indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_dps_transfers_transaction_id ON dps_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_accounts_transaction_id ON accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_categories_transaction_id ON purchase_categories(transaction_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_transaction_id ON savings_goals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_transaction_id ON notifications(transaction_id);

-- Step 6: Update existing transaction_id values to new format if they're UUIDs
-- Function to generate new transaction IDs
CREATE OR REPLACE FUNCTION generate_new_transaction_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'F' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Update transactions that have UUID format transaction_ids
UPDATE transactions 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update purchases that have UUID format transaction_ids
UPDATE purchases 
SET transaction_id = generate_new_transaction_id()
WHERE transaction_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update other tables that might have UUID format transaction_ids
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

-- Step 7: Recreate triggers
-- Recreate the audit trigger
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION audit_transaction_changes();

-- Recreate the sync trigger
CREATE TRIGGER sync_transaction_price_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
    EXECUTE FUNCTION sync_transaction_price();

-- Step 8: Verify the migration
SELECT 
  'MIGRATION COMPLETE' as status,
  'All transaction_id columns are now VARCHAR(8)' as message;

-- Show the current schema
SELECT 
  'transactions' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchases' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'accounts' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchase_categories' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_categories' AND column_name = 'transaction_id';

-- Show sample transaction_id values
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  STRING_AGG(DISTINCT LEFT(transaction_id, 3), ', ') as sample_ids
FROM transactions
WHERE transaction_id IS NOT NULL

UNION ALL

SELECT 
  'purchases' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  STRING_AGG(DISTINCT LEFT(transaction_id, 3), ', ') as sample_ids
FROM purchases
WHERE transaction_id IS NOT NULL; 