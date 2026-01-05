-- Check BDT categories for user: salauddin.kader406
-- This query checks both income/expense categories and purchase categories

-- Step 1: Find the user ID
SELECT 
    id as user_id,
    email,
    created_at as user_created_at
FROM auth.users
WHERE email LIKE '%salauddin.kader406%'
LIMIT 1;

-- Step 2: Check all categories for this user (grouped by currency)
SELECT 
    'Income/Expense Categories' as category_type,
    currency,
    type,
    COUNT(*) as count,
    STRING_AGG(name, ', ' ORDER BY name) as category_names
FROM categories
WHERE user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1
)
GROUP BY currency, type
ORDER BY currency, type;

-- Step 3: Specifically check for BDT categories
SELECT 
    'BDT Categories Check' as check_type,
    COUNT(*) as bdt_category_count,
    STRING_AGG(name, ', ' ORDER BY name) as bdt_category_names
FROM categories
WHERE user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1
)
AND currency = 'BDT';

-- Step 4: Check purchase categories for BDT
SELECT 
    'BDT Purchase Categories Check' as check_type,
    COUNT(*) as bdt_purchase_category_count,
    STRING_AGG(category_name, ', ' ORDER BY category_name) as bdt_purchase_category_names
FROM purchase_categories
WHERE user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1
)
AND currency = 'BDT';

-- Step 5: Check all purchase categories grouped by currency
SELECT 
    'Purchase Categories' as category_type,
    currency,
    COUNT(*) as count,
    STRING_AGG(category_name, ', ' ORDER BY category_name) as category_names
FROM purchase_categories
WHERE user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1
)
GROUP BY currency
ORDER BY currency;

-- Step 6: Check transactions with "everything" category
SELECT 
    'Transactions with "everything" category' as check_type,
    COUNT(*) as transaction_count,
    STRING_AGG(DISTINCT account_id::text, ', ') as account_ids,
    STRING_AGG(DISTINCT type, ', ') as transaction_types
FROM transactions
WHERE user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1
)
AND category = 'everything';

-- Step 7: Check account currencies for this user
SELECT 
    'User Accounts' as check_type,
    name as account_name,
    currency,
    initial_balance,
    calculated_balance,
    is_active
FROM accounts
WHERE user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1
)
ORDER BY currency, name;

-- Step 8: Summary - Does user have BDT categories?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM categories 
            WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
            AND currency = 'BDT'
        ) OR EXISTS (
            SELECT 1 FROM purchase_categories 
            WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
            AND currency = 'BDT'
        ) THEN 'YES - User has BDT categories'
        ELSE 'NO - User does NOT have BDT categories'
    END as bdt_categories_exist;

