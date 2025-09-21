-- =====================================================
-- ACTIVATE PREMIUM PLAN FOR SPECIFIC USER
-- User ID: 2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf
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
WHERE p.id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf';

-- Step 2: Upgrade user to premium plan
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
    }'::jsonb,
    'admin_upgrade', jsonb_build_object(
        'upgraded_at', NOW()::text,
        'duration_months', 12,
        'notes', 'Manual premium activation via admin'
    )
),
updated_at = NOW()
WHERE id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf';

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
    '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf',
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
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
    p.subscription->'admin_upgrade' as admin_upgrade_info
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf';

-- Step 5: Show subscription history
SELECT '=== SUBSCRIPTION HISTORY ===' as info;

SELECT 
    sh.user_id,
    u.email,
    sh.plan_name,
    sh.status,
    sh.start_date,
    sh.end_date,
    sh.payment_method,
    sh.created_at
FROM subscription_history sh
JOIN auth.users u ON sh.user_id = u.id
WHERE sh.user_id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf'
ORDER BY sh.created_at DESC;

-- Step 6: Summary
SELECT '=== UPGRADE SUMMARY ===' as info;

SELECT 
    '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf' as user_id,
    'premium' as new_plan,
    '1 year' as duration,
    NOW() as upgrade_time,
    'admin_upgrade' as method;
