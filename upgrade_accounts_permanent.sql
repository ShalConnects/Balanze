-- =====================================================
-- PERMANENT PREMIUM UPGRADE FOR SPECIFIC USERS
-- Upgrading users to premium without expiration
-- =====================================================

-- User IDs to upgrade
-- d1fe3ccc-3c57-4621-866a-6d0643137d53
-- cb3ac634-432d-4602-b2f9-3249702020d9

-- Step 1: Check current status of both users
SELECT '=== CURRENT STATUS ===' as info;

SELECT 
    p.id,
    p.full_name,
    u.email,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as status,
    p.subscription->>'validUntil' as valid_until
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    'd1fe3ccc-3c57-4621-866a-6d0643137d53',
    'cb3ac634-432d-4602-b2f9-3249702020d9'
);

-- Step 2: Upgrade both users to premium with NO EXPIRATION
UPDATE profiles 
SET subscription = jsonb_build_object(
    'plan', 'premium',
    'status', 'active',
    'validUntil', null, -- NO EXPIRATION
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
    'permanent_upgrade', jsonb_build_object(
        'upgraded_at', NOW()::text,
        'duration', 'permanent',
        'notes', 'Permanent premium upgrade - no expiration'
    )
),
updated_at = NOW()
WHERE id IN (
    'd1fe3ccc-3c57-4621-866a-6d0643137d53',
    'cb3ac634-432d-4602-b2f9-3249702020d9'
);

-- Step 3: Record in subscription history for both users
INSERT INTO subscription_history (
    user_id, 
    plan_name, 
    status, 
    start_date, 
    end_date, 
    amount_paid, 
    currency, 
    payment_method
) 
SELECT 
    id as user_id,
    'premium' as plan_name,
    'active' as status,
    NOW() as start_date,
    null as end_date, -- NO END DATE
    0.00 as amount_paid,
    'USD' as currency,
    'permanent_upgrade' as payment_method
FROM profiles 
WHERE id IN (
    'd1fe3ccc-3c57-4621-866a-6d0643137d53',
    'cb3ac634-432d-4602-b2f9-3249702020d9'
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
    p.subscription->'features' as features
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id IN (
    'd1fe3ccc-3c57-4621-866a-6d0643137d53',
    'cb3ac634-432d-4602-b2f9-3249702020d9'
);

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
WHERE sh.user_id IN (
    'd1fe3ccc-3c57-4621-866a-6d0643137d53',
    'cb3ac634-432d-4602-b2f9-3249702020d9'
)
ORDER BY sh.created_at DESC;

-- Step 6: Summary
SELECT '=== PERMANENT UPGRADE SUMMARY ===' as info;

SELECT 
    COUNT(*) as users_upgraded,
    'premium' as new_plan,
    'permanent' as duration,
    NOW() as upgrade_time
FROM profiles 
WHERE id IN (
    'd1fe3ccc-3c57-4621-866a-6d0643137d53',
    'cb3ac634-432d-4602-b2f9-3249702020d9'
)
AND subscription->>'plan' = 'premium'
AND subscription->>'validUntil' IS NULL; 