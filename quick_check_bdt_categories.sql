-- Quick check: Does user have BDT categories?
-- Replace 'salauddin.kader406' with the exact email if different

WITH user_info AS (
    SELECT id as user_id, email
    FROM auth.users
    WHERE email LIKE '%salauddin.kader406%'
    LIMIT 1
)
SELECT 
    'Summary' as check_type,
    (SELECT COUNT(*) FROM categories c WHERE c.user_id = ui.user_id AND c.currency = 'BDT') as bdt_income_expense_categories,
    (SELECT COUNT(*) FROM purchase_categories pc WHERE pc.user_id = ui.user_id AND pc.currency = 'BDT') as bdt_purchase_categories,
    (SELECT COUNT(*) FROM categories c WHERE c.user_id = ui.user_id) as total_categories,
    (SELECT COUNT(*) FROM purchase_categories pc WHERE pc.user_id = ui.user_id) as total_purchase_categories,
    (SELECT COUNT(*) FROM transactions t WHERE t.user_id = ui.user_id AND t.category = 'everything') as transactions_with_everything,
    CASE 
        WHEN EXISTS (SELECT 1 FROM categories c WHERE c.user_id = ui.user_id AND c.currency = 'BDT')
             OR EXISTS (SELECT 1 FROM purchase_categories pc WHERE pc.user_id = ui.user_id AND pc.currency = 'BDT')
        THEN 'YES - Has BDT categories'
        ELSE 'NO - Missing BDT categories'
    END as result
FROM user_info ui;

-- Detailed BDT categories list
SELECT 
    'BDT Income/Expense Categories' as type,
    name,
    type as category_type,
    currency
FROM categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND currency = 'BDT'
ORDER BY type, name;

-- Detailed BDT purchase categories list
SELECT 
    'BDT Purchase Categories' as type,
    category_name as name,
    currency
FROM purchase_categories
WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%salauddin.kader406%' LIMIT 1)
AND currency = 'BDT'
ORDER BY category_name;

