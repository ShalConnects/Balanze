-- =====================================================
-- MANUAL PREMIUM UPGRADE FOR TESTING
-- Use this to upgrade your test/personal account to premium without payment
-- =====================================================

-- Method 1: Direct subscription update (replace YOUR_USER_ID with your actual user ID)
UPDATE profiles 
SET subscription = jsonb_build_object(
    'plan', 'premium',
    'status', 'active',
    'validUntil', (NOW() + INTERVAL '1 year')::text,
    'features', '{
        "max_accounts": -1,
        "max_transactions": -1,
        "max_currencies": -1,
        "analytics": true,
        "priority_support": true,
        "export_data": true,
        "custom_categories": true,
        "lend_borrow": true,
        "last_wish": true,
        "advanced_charts": true,
        "advanced_reporting": true
    }'::jsonb
),
updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE'; -- Replace with your actual user ID

-- Method 2: Using the existing upgrade function (replace YOUR_USER_ID)
SELECT upgrade_user_subscription(
    'YOUR_USER_ID_HERE'::uuid, -- Replace with your actual user ID
    'premium',
    'manual_upgrade'
);

-- Method 3: Update by email (if you know your email)
UPDATE profiles 
SET subscription = jsonb_build_object(
    'plan', 'premium',
    'status', 'active',
    'validUntil', (NOW() + INTERVAL '1 year')::text,
    'features', '{
        "max_accounts": -1,
        "max_transactions": -1,
        "max_currencies": -1,
        "analytics": true,
        "priority_support": true,
        "export_data": true,
        "custom_categories": true,
        "lend_borrow": true,
        "last_wish": true,
        "advanced_charts": true,
        "advanced_reporting": true
    }'::jsonb
),
updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com' -- Replace with your email
);

-- Verify the upgrade worked
SELECT 
    p.id,
    p.full_name,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as status,
    p.subscription->>'validUntil' as valid_until,
    p.subscription->'features' as features
FROM profiles p
WHERE p.id = 'YOUR_USER_ID_HERE'; -- Replace with your actual user ID

-- Show all premium users
SELECT 
    p.id,
    p.full_name,
    u.email,
    p.subscription->>'plan' as plan,
    p.subscription->>'status' as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.subscription->>'plan' = 'premium'; 