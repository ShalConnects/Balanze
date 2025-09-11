-- =====================================================
-- UPDATE SUBSCRIPTION PLAN FEATURES
-- Align database features with frontend plan structure
-- =====================================================

-- Step 1: Update Free plan features
UPDATE subscription_plans 
SET 
    features = '{
        "max_accounts": 5,
        "max_transactions": 100,
        "max_currencies": 1,
        "analytics": false,
        "priority_support": false,
        "export_data": false,
        "custom_categories": false,
        "lend_borrow": false,
        "last_wish": false,
        "advanced_charts": false,
        "advanced_reporting": false
    }'::jsonb,
    price = 0.00,
    description = 'Basic plan with limited features',
    updated_at = NOW()
WHERE name = 'free';

-- Step 2: Update Premium plan features
UPDATE subscription_plans 
SET 
    features = '{
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
    price = 7.99,
    description = 'Premium plan with all features',
    updated_at = NOW()
WHERE name = 'premium';

-- Step 3: Add one-time billing option for Premium
INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features, is_active) 
VALUES (
    'premium_lifetime',
    'Premium plan with lifetime access',
    99.99,
    'USD',
    'one-time',
    '{
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
    true
) ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Step 4: Verify the updates
SELECT 
    name,
    price,
    billing_cycle,
    features->>'max_accounts' as max_accounts,
    features->>'max_currencies' as max_currencies,
    features->>'last_wish' as last_wish,
    updated_at
FROM subscription_plans 
WHERE is_active = true
ORDER BY price; 