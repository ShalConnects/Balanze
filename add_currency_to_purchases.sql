-- Add currency support to purchase system
-- This migration adds currency fields to purchases and purchase_categories tables

-- Add currency column to purchase_categories table
ALTER TABLE purchase_categories 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Add currency column to purchases table
ALTER TABLE purchases 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Update existing purchase categories to have USD as default currency
UPDATE purchase_categories 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Update existing purchases to have USD as default currency
UPDATE purchases 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Add indexes for better performance on currency-based queries
CREATE INDEX IF NOT EXISTS idx_purchase_categories_currency ON purchase_categories(currency);
CREATE INDEX IF NOT EXISTS idx_purchases_currency ON purchases(currency);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_purchases_currency_status ON purchases(currency, status);
CREATE INDEX IF NOT EXISTS idx_purchases_currency_category ON purchases(currency, category);

-- Update RLS policies to include currency in the policies
DROP POLICY IF EXISTS "Users can view their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can view their own purchase categories" ON purchase_categories
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can insert their own purchase categories" ON purchase_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can update their own purchase categories" ON purchase_categories
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can delete their own purchase categories" ON purchase_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Update purchase RLS policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
CREATE POLICY "Users can insert their own purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchases" ON purchases;
CREATE POLICY "Users can update their own purchases" ON purchases
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchases" ON purchases;
CREATE POLICY "Users can delete their own purchases" ON purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for currency-specific purchase analytics
CREATE OR REPLACE VIEW purchase_analytics_by_currency AS
SELECT 
    currency,
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN status = 'purchased' THEN 1 END) as purchased_count,
    COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
    SUM(CASE WHEN status = 'purchased' THEN price ELSE 0 END) as total_spent,
    AVG(CASE WHEN status = 'purchased' THEN price ELSE NULL END) as avg_purchase_price,
    MAX(CASE WHEN status = 'purchased' THEN price ELSE 0 END) as max_purchase_price,
    MIN(CASE WHEN status = 'purchased' THEN price ELSE NULL END) as min_purchase_price
FROM purchases
GROUP BY currency;

-- Grant access to the view
GRANT SELECT ON purchase_analytics_by_currency TO authenticated;

-- Create a view for category budgets by currency
CREATE OR REPLACE VIEW category_budgets_by_currency AS
SELECT 
    pc.currency,
    pc.category_name,
    pc.monthly_budget,
    pc.category_color,
    COALESCE(SUM(CASE WHEN p.status = 'purchased' THEN p.price ELSE 0 END), 0) as spent_this_month,
    pc.monthly_budget - COALESCE(SUM(CASE WHEN p.status = 'purchased' THEN p.price ELSE 0 END), 0) as remaining_budget,
    CASE 
        WHEN pc.monthly_budget > 0 THEN 
            (COALESCE(SUM(CASE WHEN p.status = 'purchased' THEN p.price ELSE 0 END), 0) / pc.monthly_budget) * 100
        ELSE 0 
    END as budget_usage_percentage
FROM purchase_categories pc
LEFT JOIN purchases p ON pc.category_name = p.category 
    AND pc.currency = p.currency 
    AND p.status = 'purchased'
    AND DATE_TRUNC('month', p.purchase_date::date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY pc.currency, pc.category_name, pc.monthly_budget, pc.category_color;

-- Grant access to the view
GRANT SELECT ON category_budgets_by_currency TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN purchase_categories.currency IS 'Currency code for the category budget (e.g., USD, BDT, EUR)';
COMMENT ON COLUMN purchases.currency IS 'Currency code for the purchase amount (e.g., USD, BDT, EUR)';
COMMENT ON VIEW purchase_analytics_by_currency IS 'Analytics view showing purchase statistics grouped by currency';
COMMENT ON VIEW category_budgets_by_currency IS 'View showing category budgets and spending by currency'; 