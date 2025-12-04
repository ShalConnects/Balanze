-- Test query to preview what the currency migration will do
-- Run this first to see the impact before running the actual migration

-- Show current state
SELECT 
    'Current State' as status,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_categories,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_categories
FROM categories;

-- Show what currencies users have set
SELECT 
    'User Currency Preferences' as status,
    p.local_currency,
    COUNT(p.id) as user_count
FROM profiles p
GROUP BY p.local_currency
ORDER BY user_count DESC;

-- Show what the migration will do (preview)
SELECT 
    'Migration Preview' as status,
    c.type,
    p.local_currency as user_preferred_currency,
    COUNT(c.id) as categories_that_will_get_this_currency
FROM categories c
LEFT JOIN profiles p ON c.user_id = p.id
GROUP BY c.type, p.local_currency
ORDER BY c.type, p.local_currency;

-- Show categories that will be affected
SELECT 
    'Categories to be updated' as status,
    c.id,
    c.name,
    c.type,
    c.user_id,
    p.full_name,
    p.local_currency as user_currency,
    'Will be set to: ' || COALESCE(p.local_currency, 'USD') as new_currency
FROM categories c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.type, c.name; 