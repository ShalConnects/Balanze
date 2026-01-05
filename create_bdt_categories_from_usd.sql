-- Create BDT categories for user by copying USD categories
-- This will help users who have USD categories but need BDT categories

-- Step 1: Check what will be created (preview)
WITH user_info AS (
    SELECT id as user_id, email
    FROM auth.users
    WHERE email LIKE '%salauddin.kader406%'
    LIMIT 1
)
SELECT 
    'Preview: Categories to be created' as action,
    name,
    type,
    'BDT' as new_currency,
    currency as current_currency
FROM categories
WHERE user_id = (SELECT user_id FROM user_info)
AND currency = 'USD'
AND NOT EXISTS (
    SELECT 1 FROM categories c2 
    WHERE c2.user_id = categories.user_id 
    AND c2.name = categories.name 
    AND c2.type = categories.type
    AND c2.currency = 'BDT'
);

-- Step 2: Create BDT income/expense categories from USD (if they don't exist)
INSERT INTO categories (user_id, name, type, color, icon, description, currency)
SELECT 
    user_id,
    name,
    type,
    color,
    icon,
    description,
    'BDT' as currency
FROM categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND currency = 'USD'
AND NOT EXISTS (
    SELECT 1 FROM categories c2 
    WHERE c2.user_id = categories.user_id 
    AND c2.name = categories.name 
    AND c2.type = categories.type
    AND c2.currency = 'BDT'
);

-- Step 3: Create BDT purchase categories from USD (if they don't exist)
INSERT INTO purchase_categories (user_id, category_name, description, monthly_budget, currency, category_color)
SELECT 
    user_id,
    category_name,
    description,
    monthly_budget,
    'BDT' as currency,
    category_color
FROM purchase_categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND currency = 'USD'
AND NOT EXISTS (
    SELECT 1 FROM purchase_categories pc2 
    WHERE pc2.user_id = purchase_categories.user_id 
    AND pc2.category_name = purchase_categories.category_name
    AND pc2.currency = 'BDT'
);

-- Step 4: Verify what was created
SELECT 
    'Created BDT Categories' as result,
    COUNT(*) as count,
    STRING_AGG(name, ', ' ORDER BY name) as category_names
FROM categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND currency = 'BDT';

SELECT 
    'Created BDT Purchase Categories' as result,
    COUNT(*) as count,
    STRING_AGG(category_name, ', ' ORDER BY category_name) as category_names
FROM purchase_categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND currency = 'BDT';

