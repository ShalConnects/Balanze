-- =====================================================
-- ADD POSITION FIELD FOR MANUAL ACCOUNT REORDERING
-- =====================================================

-- Add position field to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing accounts to have position based on created_at (newest first)
-- This maintains the current default ordering
UPDATE accounts 
SET position = subquery.row_number
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_number
    FROM accounts
) as subquery
WHERE accounts.id = subquery.id;

-- Create index for better performance on position-based queries
CREATE INDEX IF NOT EXISTS idx_accounts_user_position 
ON accounts(user_id, position);

-- Add comment to document the field
COMMENT ON COLUMN accounts.position IS 'Manual ordering position for accounts. Lower numbers appear first. 0 means use default ordering.';
