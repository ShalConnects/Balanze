-- =====================================================
-- UPDATE ACCOUNT LIMIT FROM 5 TO 3 - FIXED VERSION
-- Update all database policies and functions to enforce 3 account limit for free users
-- =====================================================

-- Update the default free plan features in get_user_plan_features function
CREATE OR REPLACE FUNCTION get_user_plan_features(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_plan TEXT;
    plan_features JSONB;
BEGIN
    -- Get user's plan
    SELECT subscription->>'plan' INTO user_plan 
    FROM profiles WHERE id = user_uuid;
    
    -- Default to free if no plan found
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;
    
    -- Get plan features
    SELECT features INTO plan_features 
    FROM subscription_plans WHERE name = user_plan;
    
    -- Return default free features if plan not found
    IF plan_features IS NULL THEN
        plan_features := '{"max_accounts": 3, "max_transactions": 100, "max_currencies": 1, "analytics": false, "priority_support": false, "export_data": false, "custom_categories": false, "lend_borrow": false, "last_wish": false, "advanced_charts": false, "advanced_reporting": false}'::jsonb;
    END IF;
    
    RETURN plan_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the account limit enforcement trigger function
CREATE OR REPLACE FUNCTION enforce_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Check account limit
        IF NOT check_account_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'ACCOUNT_LIMIT_EXCEEDED: Free plan allows up to 3 accounts. Upgrade to Premium for unlimited accounts.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update subscription plans table if it exists
UPDATE subscription_plans 
SET features = jsonb_set(features, '{max_accounts}', '3')
WHERE name = 'free' AND features->>'max_accounts' = '5';

-- Insert or update free plan with proper JSON formatting
INSERT INTO subscription_plans (name, price, currency, billing_cycle, features, created_at, updated_at)
VALUES (
    'free',
    0.00,
    'USD',
    'monthly',
    '{"max_accounts": 3, "max_transactions": 100, "max_currencies": 1, "analytics": false, "priority_support": false, "export_data": false, "custom_categories": false, "lend_borrow": false, "last_wish": false, "advanced_charts": false, "advanced_reporting": false}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    features = EXCLUDED.features,
    updated_at = NOW();

-- Update premium plan to ensure it has unlimited accounts
UPDATE subscription_plans 
SET features = jsonb_set(features, '{max_accounts}', '-1')
WHERE name = 'premium';

-- Insert or update premium plan with proper JSON formatting
INSERT INTO subscription_plans (name, price, currency, billing_cycle, features, created_at, updated_at)
VALUES (
    'premium',
    7.99,
    'USD',
    'monthly',
    '{"max_accounts": -1, "max_transactions": -1, "max_currencies": -1, "analytics": true, "priority_support": true, "export_data": true, "custom_categories": true, "lend_borrow": true, "last_wish": true, "advanced_charts": true, "advanced_reporting": true}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    features = EXCLUDED.features,
    updated_at = NOW();

-- Verify the changes
SELECT 
    name,
    price,
    currency,
    features->>'max_accounts' as max_accounts,
    features->>'max_currencies' as max_currencies,
    features->>'max_transactions' as max_transactions
FROM subscription_plans 
ORDER BY name;
