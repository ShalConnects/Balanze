-- Comprehensive check: See all categories and accounts for user
-- This will show the currency mismatch issue

-- Show all categories the user has (all currencies)
SELECT 
    'All User Categories' as check_type,
    currency,
    type,
    COUNT(*) as count,
    STRING_AGG(name, ', ' ORDER BY name) as category_names
FROM categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
GROUP BY currency, type
ORDER BY currency, type;

-- Show all purchase categories the user has (all currencies)
SELECT 
    'All User Purchase Categories' as check_type,
    currency,
    COUNT(*) as count,
    STRING_AGG(category_name, ', ' ORDER BY category_name) as category_names
FROM purchase_categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
GROUP BY currency
ORDER BY currency;

-- Show all accounts and their currencies
SELECT 
    'User Accounts' as check_type,
    name as account_name,
    currency,
    type as account_type,
    is_active,
    initial_balance,
    calculated_balance
FROM accounts
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
ORDER BY currency, name;

-- Show the mismatch: What currencies are needed vs what exists
SELECT 
    'Currency Mismatch Analysis' as check_type,
    a.currency as account_currency,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.user_id = a.user_id 
            AND c.currency = a.currency
        ) THEN 'Has categories'
        ELSE 'MISSING categories'
    END as income_expense_categories_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM purchase_categories pc 
            WHERE pc.user_id = a.user_id 
            AND pc.currency = a.currency
        ) THEN 'Has categories'
        ELSE 'MISSING categories'
    END as purchase_categories_status,
    COUNT(DISTINCT a.id) as account_count
FROM accounts a
WHERE a.user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
GROUP BY a.currency, a.user_id
ORDER BY a.currency;

-- Show transactions with "everything" category and their account currencies
SELECT 
    'Transactions with "everything" category' as check_type,
    t.category,
    a.currency as account_currency,
    t.type as transaction_type,
    t.amount,
    t.date,
    COUNT(*) as count
FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE t.user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND t.category = 'everything'
GROUP BY t.category, a.currency, t.type, t.amount, t.date
ORDER BY t.date DESC;

