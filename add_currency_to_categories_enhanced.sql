-- Enhanced migration: Add currency support to categories table
-- This migration adds currency field to categories table and sets it based on user's local_currency
-- Includes logging and edge case handling

-- Step 1: Add currency column to categories table
ALTER TABLE categories 
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Step 2: Log the migration start
DO $$
BEGIN
    RAISE NOTICE 'Starting currency migration for categories table...';
    RAISE NOTICE 'Total categories before migration: %', (SELECT COUNT(*) FROM categories);
END $$;

-- Step 3: Update categories with user's local_currency preference
-- This joins categories with profiles to get the user's preferred currency
UPDATE categories 
SET currency = COALESCE(p.local_currency, 'USD')
FROM profiles p
WHERE categories.user_id = p.id 
  AND categories.currency = 'USD'; -- Only update default USD values

-- Step 4: Log the results
DO $$
DECLARE
    total_categories INTEGER;
    updated_categories INTEGER;
    usd_categories INTEGER;
    bdt_categories INTEGER;
    eur_categories INTEGER;
    gbp_categories INTEGER;
    jpy_categories INTEGER;
    other_categories INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO total_categories FROM categories;
    SELECT COUNT(*) INTO usd_categories FROM categories WHERE currency = 'USD';
    SELECT COUNT(*) INTO bdt_categories FROM categories WHERE currency = 'BDT';
    SELECT COUNT(*) INTO eur_categories FROM categories WHERE currency = 'EUR';
    SELECT COUNT(*) INTO gbp_categories FROM categories WHERE currency = 'GBP';
    SELECT COUNT(*) INTO jpy_categories FROM categories WHERE currency = 'JPY';
    SELECT COUNT(*) INTO other_categories FROM categories WHERE currency NOT IN ('USD', 'BDT', 'EUR', 'GBP', 'JPY');
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Total categories: %', total_categories;
    RAISE NOTICE 'USD categories: %', usd_categories;
    RAISE NOTICE 'BDT categories: %', bdt_categories;
    RAISE NOTICE 'EUR categories: %', eur_categories;
    RAISE NOTICE 'GBP categories: %', gbp_categories;
    RAISE NOTICE 'JPY categories: %', jpy_categories;
    RAISE NOTICE 'Other currencies: %', other_categories;
END $$;

-- Step 5: Make currency NOT NULL after setting defaults
ALTER TABLE categories 
ALTER COLUMN currency SET NOT NULL;

-- Step 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_currency ON categories(currency);
CREATE INDEX IF NOT EXISTS idx_categories_type_currency ON categories(type, currency);
CREATE INDEX IF NOT EXISTS idx_categories_user_currency ON categories(user_id, currency);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN categories.currency IS 'Currency code for the category (e.g., USD, BDT, EUR) - defaults to user''s local_currency preference';

-- Step 8: Final verification
DO $$
BEGIN
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE 'Categories with NULL currency: %', (SELECT COUNT(*) FROM categories WHERE currency IS NULL);
    RAISE NOTICE 'Categories with valid currency: %', (SELECT COUNT(*) FROM categories WHERE currency IS NOT NULL);
    RAISE NOTICE 'Currency migration completed successfully!';
END $$; 