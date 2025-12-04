-- Add currency support to categories table
-- Run this in your Supabase SQL Editor

-- Step 1: Add currency column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Step 2: Update existing categories to use each user's local_currency preference
UPDATE categories 
SET currency = COALESCE(p.local_currency, 'USD')
FROM profiles p
WHERE categories.user_id = p.id 
  AND categories.currency = 'USD';

-- Step 3: For any categories that don't have a matching profile (fallback)
UPDATE categories 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Step 4: Make currency NOT NULL after setting defaults
ALTER TABLE categories 
ALTER COLUMN currency SET NOT NULL;

-- Step 5: Add index for better performance on currency-based queries
CREATE INDEX IF NOT EXISTS idx_categories_currency ON categories(currency);

-- Step 6: Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_categories_type_currency ON categories(type, currency);

-- Step 7: Verify the changes
SELECT 
  name, 
  type, 
  currency, 
  user_id 
FROM categories 
ORDER BY currency, name 
LIMIT 10;

-- Step 8: Show summary
SELECT 
  currency,
  type,
  COUNT(*) as count
FROM categories 
GROUP BY currency, type 
ORDER BY currency, type; 