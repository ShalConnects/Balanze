-- Add account_id column to purchases table
-- This column stores the account information for excluded purchases that don't have linked transactions

ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Add comment to explain the column purpose
COMMENT ON COLUMN purchases.account_id IS 'Stores the account ID for excluded purchases that do not have linked transactions. Used to display account information when editing excluded purchases.';

-- Create index for better performance when querying by account_id
CREATE INDEX IF NOT EXISTS idx_purchases_account_id ON purchases(account_id); 