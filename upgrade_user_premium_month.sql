-- =====================================================
-- UPGRADE USER TO PREMIUM FOR ONE MONTH
-- User Email: anylogin85@gmail.com
-- User ID: 0d497c5c-3242-425e-aa73-1081385f46e5
-- Duration: 1 month
-- =====================================================

-- Step 1: Check current status of the user
SELECT '=== CURRENT USER STATUS ===' as info;

SELECT 
    p.id,
    p.full_name,
    u.email,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as status,
    p.subscription->>'validUntil' as valid_until,
    p.subscription->'features' as features
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = '0d497c5c-3242-425e-aa73-1081385f46e5'
   OR u.email = 'anylogin85@gmail.com';

-- Step 2: Upgrade user to premium plan for 1 month
UPDATE profiles 
SET subscription = jsonb_build_object(
    'plan', 'premium',
    'status', 'active',
    'validUntil', (NOW() + INTERVAL '1 month')::text,
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
    }'::jsonb,
    'admin_upgrade', jsonb_build_object(
        'upgraded_at', NOW()::text,
        'duration_months', 1,
        'notes', 'Manual premium activation via admin - 1 month duration'
    )
),
updated_at = NOW()
WHERE id = '0d497c5c-3242-425e-aa73-1081385f46e5';

-- Step 3: Record in subscription history
INSERT INTO subscription_history (
    user_id, 
    plan_name, 
    status, 
    start_date, 
    end_date, 
    amount_paid, 
    currency, 
    payment_method
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month',
    0.00,
    'USD',
    'admin_upgrade'
);

-- Step 4: Verify the upgrade worked
SELECT '=== UPGRADE VERIFICATION ===' as info;

SELECT 
    p.id,
    p.full_name,
    u.email,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as status,
    p.subscription->>'validUntil' as valid_until,
    p.subscription->'features' as features,
    p.updated_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = '0d497c5c-3242-425e-aa73-1081385f46e5';

-- Step 5: Show subscription history entry
SELECT '=== SUBSCRIPTION HISTORY ===' as info;

SELECT 
    user_id,
    plan_name,
    status,
    start_date,
    end_date,
    amount_paid,
    payment_method,
    created_at
FROM subscription_history 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5'
ORDER BY created_at DESC
LIMIT 5;

-- Success message
SELECT '=== UPGRADE COMPLETED ===' as info;
SELECT 'User anylogin85@gmail.com has been upgraded to premium for 1 month' as result;
