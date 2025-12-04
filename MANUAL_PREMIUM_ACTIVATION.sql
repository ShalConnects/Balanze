-- =====================================================
-- MANUAL PREMIUM ACTIVATION FOR USER
-- User ID: 2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Execute the script
-- =====================================================

-- Step 1: Check current status
SELECT '=== CURRENT USER STATUS ===' as info;

SELECT 
    id,
    full_name,
    subscription->>'plan' as current_plan,
    subscription->>'status' as status,
    subscription->>'validUntil' as valid_until,
    created_at
FROM profiles 
WHERE id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf';

-- Step 2: Create/Update user profile with premium subscription
-- This uses INSERT ... ON CONFLICT to handle both creation and updates
INSERT INTO profiles (
    id,
    full_name,
    subscription,
    created_at,
    updated_at
) VALUES (
    '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf',
    'Premium User',
    '{
        "plan": "premium",
        "status": "active",
        "validUntil": "' || (NOW() + INTERVAL '1 year')::text || '",
        "features": {
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
        },
        "admin_upgrade": {
            "upgraded_at": "' || NOW()::text || '",
            "duration_months": 12,
            "notes": "Manual premium activation via admin"
        }
    }'::jsonb,
    COALESCE((SELECT created_at FROM profiles WHERE id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf'), NOW()),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    subscription = EXCLUDED.subscription,
    updated_at = NOW();

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

-- Step 4: Verify the upgrade
SELECT '=== UPGRADE VERIFICATION ===' as info;

SELECT 
    id,
    full_name,
    subscription->>'plan' as current_plan,
    subscription->>'status' as status,
    subscription->>'validUntil' as valid_until,
    subscription->'features' as features,
    subscription->'admin_upgrade' as admin_upgrade_info,
    created_at,
    updated_at
FROM profiles 
WHERE id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf';

-- Step 5: Show subscription history
SELECT '=== SUBSCRIPTION HISTORY ===' as info;

SELECT 
    user_id,
    plan_name,
    status,
    start_date,
    end_date,
    payment_method,
    amount_paid,
    currency,
    created_at
FROM subscription_history 
WHERE user_id = '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf'
ORDER BY created_at DESC;

-- Step 6: Final summary
SELECT '=== FINAL SUMMARY ===' as info;

SELECT 
    '2ce6153b-7ab5-4aaf-b8be-c1a00b1d8daf' as user_id,
    'premium' as plan,
    'active' as status,
    '1 year' as duration,
    NOW() as activation_time,
    'admin_upgrade' as method;

-- =====================================================
-- PREMIUM FEATURES ACTIVATED:
-- =====================================================
-- ✅ Unlimited accounts (max_accounts: -1)
-- ✅ Unlimited transactions (max_transactions: -1)
-- ✅ Unlimited currencies (max_currencies: -1)
-- ✅ Advanced analytics (analytics: true)
-- ✅ Priority support (priority_support: true)
-- ✅ Data export (export_data: true)
-- ✅ Custom categories (custom_categories: true)
-- ✅ Lend/Borrow functionality (lend_borrow: true)
-- ✅ Last Wish feature (last_wish: true)
-- ✅ Advanced charts (advanced_charts: true)
-- ✅ Advanced reporting (advanced_reporting: true)
-- =====================================================
