-- Add exclude_from_calculation column to purchases table
-- This column allows users to exclude historical purchases from balance calculations

ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS exclude_from_calculation BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column purpose
COMMENT ON COLUMN purchases.exclude_from_calculation IS 'When true, this purchase is excluded from account balance calculations and transaction history. Used for historical purchases made before using the app.';

-- Create index for better performance when filtering excluded purchases
CREATE INDEX IF NOT EXISTS idx_purchases_exclude_from_calculation ON purchases(exclude_from_calculation) WHERE exclude_from_calculation = true; 