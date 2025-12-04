-- Fix transaction_id columns to use VARCHAR(6) for FF format
-- This script will change the data type from UUID to VARCHAR(6)

-- First, drop any existing indexes on transaction_id columns
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
WHERE table_name = 'accounts' AND column_name = 'transaction_id'; 