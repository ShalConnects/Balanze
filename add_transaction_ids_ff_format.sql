-- Simple migration to add transaction_id columns for FF format
-- This script safely adds columns without violating foreign key constraints
-- FF format: 6-character string starting with "FF" (e.g., FF1234)

-- Add transaction_id columns to all relevant tables (without default values)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);
ALTER TABLE dps_transfers ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);
ALTER TABLE purchase_categories ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(6);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_dps_transfers_transaction_id ON dps_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_accounts_transaction_id ON accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_categories_transaction_id ON purchase_categories(transaction_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_transaction_id ON savings_goals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_transaction_id ON notifications(transaction_id); 