-- Add currency support to categories table for income categories
-- This migration adds currency field to categories table and sets it based on user's local_currency

-- Add currency column to categories table
ALTER TABLE categories 
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Update existing categories to use each user's local_currency preference
-- This joins categories with profiles to get the user's preferred currency
UPDATE categories 
SET currency = COALESCE(p.local_currency, 'USD')
FROM profiles p
WHERE categories.user_id = p.id 
  AND categories.currency IS NULL;

-- For any categories that don't have a matching profile (fallback)
UPDATE categories 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Make currency NOT NULL after setting defaults
ALTER TABLE categories 
ALTER COLUMN currency SET NOT NULL;

-- Add index for better performance on currency-based queries
CREATE INDEX IF NOT EXISTS idx_categories_currency ON categories(currency);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_categories_type_currency ON categories(type, currency);

-- Add comments for documentation
COMMENT ON COLUMN categories.currency IS 'Currency code for the category (e.g., USD, BDT, EUR)'; 