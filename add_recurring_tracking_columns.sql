-- =====================================================
-- RECURRING TRANSACTIONS TRACKING COLUMNS
-- Adds optional columns for full recurring transaction management
-- All columns are nullable - safe to add without affecting existing data
-- =====================================================

-- Add optional tracking columns to transactions table
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS next_occurrence_date DATE,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS occurrence_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
  ADD COLUMN IF NOT EXISTS parent_recurring_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Create index for efficient querying of active recurring transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(is_recurring, is_paused, next_occurrence_date)
  WHERE is_recurring = true;

-- Create index for finding child transactions from parent recurring
CREATE INDEX IF NOT EXISTS idx_transactions_parent_recurring ON transactions(parent_recurring_id)
  WHERE parent_recurring_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.next_occurrence_date IS 'Next scheduled occurrence date for recurring transactions';
COMMENT ON COLUMN transactions.is_paused IS 'Whether the recurring transaction is currently paused';
COMMENT ON COLUMN transactions.occurrence_count IS 'Number of times this recurring transaction has been processed';
COMMENT ON COLUMN transactions.recurring_end_date IS 'Optional end date for recurring transaction (null means infinite)';
COMMENT ON COLUMN transactions.parent_recurring_id IS 'References the parent recurring transaction (for tracking generated instances)';

