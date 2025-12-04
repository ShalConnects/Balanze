-- =====================================================
-- CHECK USER PURCHASE COUNT FOR megmukt@gmail.com
-- =====================================================

-- Method 1: Simple count query
SELECT 
    u.email,
    COUNT(p.id) as total_purchases,
    COUNT(CASE WHEN p.status = 'purchased' THEN 1 END) as purchased_count,
    COUNT(CASE WHEN p.status = 'planned' THEN 1 END) as planned_count,
    COUNT(CASE WHEN p.status = 'cancelled' THEN 1 END) as cancelled_count
FROM auth.users u
LEFT JOIN purchases p ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
GROUP BY u.email;

-- Method 2: Detailed breakdown with plan limits
SELECT 
    u.email,
    u.id as user_id,
    COUNT(p.id) as total_purchases,
    COUNT(CASE WHEN p.status = 'purchased' THEN 1 END) as purchased_count,
    COUNT(CASE WHEN p.status = 'planned' THEN 1 END) as planned_count,
    COUNT(CASE WHEN p.status = 'cancelled' THEN 1 END) as cancelled_count,
    -- Get user's plan features
    (SELECT features->>'max_purchases' FROM subscription_plans sp 
     JOIN profiles pr ON pr.subscription->>'plan' = sp.name 
     WHERE pr.id = u.id) as max_purchases_limit,
    -- Calculate remaining purchases
    CASE 
        WHEN (SELECT features->>'max_purchases' FROM subscription_plans sp 
              JOIN profiles pr ON pr.subscription->>'plan' = sp.name 
              WHERE pr.id = u.id) = '-1' THEN NULL
        ELSE (SELECT features->>'max_purchases' FROM subscription_plans sp 
              JOIN profiles pr ON pr.subscription->>'plan' = sp.name 
              WHERE pr.id = u.id)::INTEGER - COUNT(p.id)
    END as remaining_purchases,
    -- Show unlimited status as text
    CASE 
        WHEN (SELECT features->>'max_purchases' FROM subscription_plans sp 
              JOIN profiles pr ON pr.subscription->>'plan' = sp.name 
              WHERE pr.id = u.id) = '-1' THEN 'Unlimited'
        ELSE 'Limited'
    END as plan_type
FROM auth.users u
LEFT JOIN purchases p ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
GROUP BY u.email, u.id;

-- Method 3: Quick count only
SELECT COUNT(*) as purchase_count 
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com';

-- Method 4: Count by category
SELECT 
    p.category,
    COUNT(*) as count,
    SUM(p.price) as total_amount,
    p.currency
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
GROUP BY p.category, p.currency
ORDER BY count DESC;

-- Method 5: Recent purchases (last 10)
SELECT 
    p.item_name,
    p.category,
    p.price,
    p.currency,
    p.status,
    p.purchase_date
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
ORDER BY p.purchase_date DESC
LIMIT 10;
