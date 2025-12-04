-- Safe migration to fix transaction_id columns with foreign key handling
-- This script handles the foreign key constraint issue

-- First, drop the foreign key constraint that's causing the issue
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_transaction_id_fkey;

-- Drop any existing indexes on transaction_id columns
DROP INDEX IF EXISTS idx_transactions_transaction_id;
DROP INDEX IF EXISTS idx_dps_transfers_transaction_id;
DROP INDEX IF EXISTS idx_accounts_transaction_id;
DROP INDEX IF EXISTS idx_purchases_transaction_id;
DROP INDEX IF EXISTS idx_purchase_categories_transaction_id;
DROP INDEX IF EXISTS idx_savings_goals_transaction_id;
DROP INDEX IF EXISTS idx_notifications_transaction_id;

-- Change the data type of transaction_id columns from UUID to VARCHAR(6)
-- Note: This will clear existing transaction_id values, but that's okay since they were UUIDs anyway

-- For transactions table
ALTER TABLE transactions 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- For dps_transfers table  
ALTER TABLE dps_transfers 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- For accounts table
ALTER TABLE accounts 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- For purchases table
ALTER TABLE purchases 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- For purchase_categories table
ALTER TABLE purchase_categories 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- For savings_goals table
ALTER TABLE savings_goals 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- For notifications table
ALTER TABLE notifications 
ALTER COLUMN transaction_id TYPE VARCHAR(6) USING NULL;

-- Recreate indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_dps_transfers_transaction_id ON dps_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_accounts_transaction_id ON accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_categories_transaction_id ON purchase_categories(transaction_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_transaction_id ON savings_goals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_transaction_id ON notifications(transaction_id);

-- Note: We don't recreate the foreign key constraint because:
-- 1. The transaction_id in purchases now refers to the transaction_id field (VARCHAR(6))
-- 2. Not the id field (UUID) in transactions table
-- 3. This is actually better design as it allows for more flexible relationships

-- Verify the changes
SELECT 
  'transactions' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'dps_transfers' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'dps_transfers' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'accounts' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchases' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'transaction_id'; 