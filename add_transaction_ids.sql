-- Add transaction_id columns to track form submissions
-- This provides unique identifiers for every action in the system

-- Add transaction_id to transactions table
ALTER TABLE transactions 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Add transaction_id to dps_transfers table  
ALTER TABLE dps_transfers 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Add transaction_id to accounts table (for account creation/modification)
ALTER TABLE accounts 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Add transaction_id to purchases table
ALTER TABLE purchases 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Add transaction_id to purchase_categories table
ALTER TABLE purchase_categories 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Add transaction_id to savings_goals table
ALTER TABLE savings_goals 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Add transaction_id to notifications table
ALTER TABLE notifications 
ADD COLUMN transaction_id UUID DEFAULT gen_random_uuid();

-- Create indexes for better performance
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_dps_transfers_transaction_id ON dps_transfers(transaction_id);
CREATE INDEX idx_accounts_transaction_id ON accounts(transaction_id);
CREATE INDEX idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX idx_purchase_categories_transaction_id ON purchase_categories(transaction_id);
CREATE INDEX idx_savings_goals_transaction_id ON savings_goals(transaction_id);
CREATE INDEX idx_notifications_transaction_id ON notifications(transaction_id);

-- Update existing records with transaction IDs (if any exist)
UPDATE transactions SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;
UPDATE dps_transfers SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;
UPDATE accounts SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;
UPDATE purchases SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;
UPDATE purchase_categories SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;
UPDATE savings_goals SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;
UPDATE notifications SET transaction_id = gen_random_uuid() WHERE transaction_id IS NULL;

-- Make transaction_id NOT NULL after populating existing records
ALTER TABLE transactions ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE dps_transfers ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE purchases ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE purchase_categories ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE savings_goals ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN transaction_id SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN transactions.transaction_id IS 'Unique identifier for this transaction submission';
COMMENT ON COLUMN dps_transfers.transaction_id IS 'Unique identifier for this DPS transfer submission';
COMMENT ON COLUMN accounts.transaction_id IS 'Unique identifier for this account creation/modification';
COMMENT ON COLUMN purchases.transaction_id IS 'Unique identifier for this purchase submission';
COMMENT ON COLUMN purchase_categories.transaction_id IS 'Unique identifier for this category creation/modification';
COMMENT ON COLUMN savings_goals.transaction_id IS 'Unique identifier for this savings goal creation/modification';
COMMENT ON COLUMN notifications.transaction_id IS 'Unique identifier for this notification creation';

-- Verify the changes
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM transactions
UNION ALL
SELECT 
  'dps_transfers' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM dps_transfers
UNION ALL
SELECT 
  'accounts' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM accounts
UNION ALL
SELECT 
  'purchases' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM purchases
UNION ALL
SELECT 
  'purchase_categories' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM purchase_categories
UNION ALL
SELECT 
  'savings_goals' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM savings_goals
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id
FROM notifications; 