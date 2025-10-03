-- =====================================================
-- ENABLE PREMIUM FEATURES FOR USER
-- Email: megmukt@gmail.com
-- =====================================================

-- Step 1: Find user ID by email
SELECT '=== FINDING USER ID ===' as info;

SELECT 
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as current_status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'megmukt@gmail.com';

-- Step 2: Enable premium features for the user
-- This will work whether the user exists in profiles or not
DO $$
DECLARE
    user_id_found UUID;
    user_email TEXT := 'megmukt@gmail.com';
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_found 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_found IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: % for email: %', user_id_found, user_email;
    
    -- Update or insert premium subscription in profiles table
    INSERT INTO profiles (
        id,
        full_name,
        subscription,
        created_at,
        updated_at
    ) VALUES (
        user_id_found,
        'Premium User',
        jsonb_build_object(
            'plan', 'premium',
            'status', 'active',
            'validUntil', (NOW() + INTERVAL '1 year')::text,
            'features', jsonb_build_object(
                'max_accounts', -1,
                'max_transactions', -1,
                'max_currencies', -1,
                'analytics', true,
                'priority_support', true,
                'export_data', true,
                'custom_categories', true,
                'lend_borrow', true,
                'last_wish', true,
                'advanced_charts', true,
                'advanced_reporting', true
            ),
            'admin_upgrade', jsonb_build_object(
                'upgraded_at', NOW()::text,
                'duration_months', 12,
                'notes', 'Manual premium activation via admin'
            )
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        subscription = EXCLUDED.subscription,
        updated_at = NOW();
    
    -- Record in subscription history
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
        user_id_found,
        'premium',
        'active',
        NOW(),
        NOW() + INTERVAL '1 year',
        0.00,
        'USD',
        'admin_upgrade'
    );
    
    RAISE NOTICE 'Premium features enabled successfully for user: %', user_email;
END $$;

-- Step 3: Verify the upgrade worked
SELECT '=== UPGRADE VERIFICATION ===' as info;

SELECT 
    p.id,
    p.full_name,
    u.email,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as status,
    p.subscription->>'validUntil' as valid_until,
    p.subscription->'features' as features,
    p.subscription->'admin_upgrade' as admin_upgrade
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'megmukt@gmail.com';

-- Step 4: Check subscription history
SELECT '=== SUBSCRIPTION HISTORY ===' as info;

SELECT 
    sh.user_id,
    sh.plan_name,
    sh.status,
    sh.start_date,
    sh.end_date,
    sh.amount_paid,
    sh.payment_method,
    sh.created_at
FROM subscription_history sh
JOIN auth.users u ON sh.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
ORDER BY sh.created_at DESC;
