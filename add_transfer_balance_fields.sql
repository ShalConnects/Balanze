-- Add transfer balance and time fields to transactions table
-- This migration adds fields to store historical balances and accurate transfer times

-- Add balance after transfer field
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS balance_after_transfer DECIMAL DEFAULT NULL;

-- Add transfer time field for accurate time storage
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transfer_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better query performance on transfer-related fields
CREATE INDEX IF NOT EXISTS idx_transactions_balance_after_transfer 
ON transactions(balance_after_transfer) 
WHERE balance_after_transfer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_transfer_time 
ON transactions(transfer_time) 
WHERE transfer_time IS NOT NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN transactions.balance_after_transfer IS 'Account balance after this transfer transaction';
COMMENT ON COLUMN transactions.transfer_time IS 'Accurate transfer time (local timezone)';
