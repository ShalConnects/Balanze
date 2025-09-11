-- =====================================================
-- COMPLETE PLAN SYSTEM DEPLOYMENT
-- Run this script to deploy the entire plan system
-- =====================================================

-- Step 1: Update subscription plan features

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

-- Step 2: Add one-time billing option for Premium
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

-- Plan features updated successfully!

-- Step 3: Create enforcement functions

-- Function to get user's plan features
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
        plan_features := '{
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
        }'::jsonb;
    END IF;
    
    RETURN plan_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check account limits
CREATE OR REPLACE FUNCTION check_account_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_accounts INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max accounts limit
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    
    -- Count current active accounts
    SELECT COUNT(*) INTO current_count 
    FROM accounts 
    WHERE user_id = user_uuid AND is_active = true;
    
    -- Check limit (-1 means unlimited)
    RETURN max_accounts = -1 OR current_count < max_accounts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check currency limits
CREATE OR REPLACE FUNCTION check_currency_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_currencies INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max currencies limit
    max_currencies := (plan_features->>'max_currencies')::INTEGER;
    
    -- Count unique currencies from active accounts
    SELECT COUNT(DISTINCT currency) INTO current_count 
    FROM accounts 
    WHERE user_id = user_uuid AND is_active = true;
    
    -- Check limit (-1 means unlimited)
    RETURN max_currencies = -1 OR current_count <= max_currencies;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check transaction limits
CREATE OR REPLACE FUNCTION check_transaction_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_transactions INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max transactions limit
    max_transactions := (plan_features->>'max_transactions')::INTEGER;
    
    -- Count current transactions
    SELECT COUNT(*) INTO current_count 
    FROM transactions 
    WHERE user_id = user_uuid;
    
    -- Check limit (-1 means unlimited)
    RETURN max_transactions = -1 OR current_count < max_transactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific feature
CREATE OR REPLACE FUNCTION has_feature(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    feature_value BOOLEAN;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get feature value
    feature_value := (plan_features->>feature_name)::BOOLEAN;
    
    -- Return false if feature not found or false
    RETURN COALESCE(feature_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    account_count INTEGER;
    currency_count INTEGER;
    transaction_count INTEGER;
    max_accounts INTEGER;
    max_currencies INTEGER;
    max_transactions INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get current usage
    SELECT COUNT(*) INTO account_count 
    FROM accounts WHERE user_id = user_uuid AND is_active = true;
    
    SELECT COUNT(DISTINCT currency) INTO currency_count 
    FROM accounts WHERE user_id = user_uuid AND is_active = true;
    
    SELECT COUNT(*) INTO transaction_count 
    FROM transactions WHERE user_id = user_uuid;
    
    -- Get limits
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    max_currencies := (plan_features->>'max_currencies')::INTEGER;
    max_transactions := (plan_features->>'max_transactions')::INTEGER;
    
    -- Return usage stats
    RETURN jsonb_build_object(
        'accounts', jsonb_build_object(
            'current', account_count,
            'limit', max_accounts,
            'percentage', CASE WHEN max_accounts = -1 THEN 0 ELSE (account_count::FLOAT / max_accounts * 100) END
        ),
        'currencies', jsonb_build_object(
            'current', currency_count,
            'limit', max_currencies,
            'percentage', CASE WHEN max_currencies = -1 THEN 0 ELSE (currency_count::FLOAT / max_currencies * 100) END
        ),
        'transactions', jsonb_build_object(
            'current', transaction_count,
            'limit', max_transactions,
            'percentage', CASE WHEN max_transactions = -1 THEN 0 ELSE (transaction_count::FLOAT / max_transactions * 100) END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforcement functions created successfully!

-- Step 4: Create enforcement triggers

-- Trigger to enforce account limits
CREATE OR REPLACE FUNCTION enforce_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Check account limit
        IF NOT check_account_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'Account limit exceeded. Free plan allows up to 5 accounts. Upgrade to Premium for unlimited accounts.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_account_limit_trigger ON accounts;
CREATE TRIGGER enforce_account_limit_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_account_limit();

-- Trigger to enforce currency limits
CREATE OR REPLACE FUNCTION enforce_currency_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_currencies TEXT[];
    new_currency_exists BOOLEAN;
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Get current currencies for this user
        SELECT ARRAY_AGG(DISTINCT currency) INTO current_currencies
        FROM accounts 
        WHERE user_id = NEW.user_id AND is_active = true;
        
        -- Check if new currency already exists
        new_currency_exists := NEW.currency = ANY(current_currencies);
        
        -- If new currency and limit would be exceeded
        IF NOT new_currency_exists AND NOT check_currency_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'Currency limit exceeded. Free plan allows only 1 currency. Upgrade to Premium for unlimited currencies.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_currency_limit_trigger ON accounts;
CREATE TRIGGER enforce_currency_limit_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_currency_limit();

-- Trigger to enforce transaction limits
CREATE OR REPLACE FUNCTION enforce_transaction_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new transaction creation
    IF TG_OP = 'INSERT' THEN
        -- Check transaction limit
        IF NOT check_transaction_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'Transaction limit exceeded. Free plan allows up to 100 transactions. Upgrade to Premium for unlimited transactions.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_transaction_limit_trigger ON transactions;
CREATE TRIGGER enforce_transaction_limit_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_transaction_limit();

-- Enforcement triggers created successfully!

-- Step 5: Verify the deployment

SELECT 
    'PLAN SYSTEM DEPLOYMENT COMPLETE' as status,
    COUNT(*) as total_plans,
    COUNT(CASE WHEN name = 'free' THEN 1 END) as free_plan_exists,
    COUNT(CASE WHEN name = 'premium' THEN 1 END) as premium_plan_exists,
    COUNT(CASE WHEN name = 'premium_lifetime' THEN 1 END) as lifetime_plan_exists
FROM subscription_plans 
WHERE is_active = true;

SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'get_user_plan_features' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_plan_features') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'check_account_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_account_limit') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'check_currency_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_currency_limit') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'check_transaction_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_transaction_limit') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'has_feature' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_feature') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'get_user_usage_stats' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_usage_stats') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
    'ENFORCEMENT TRIGGERS' as check_type,
    trigger_name,
    CASE WHEN trigger_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.triggers 
WHERE trigger_name IN (
    'enforce_account_limit_trigger',
    'enforce_currency_limit_trigger', 
    'enforce_transaction_limit_trigger'
);

-- Plan system deployment completed successfully!
-- Next steps:
-- 1. Test the enforcement system with a free user
-- 2. Verify upgrade prompts work correctly
-- 3. Test Premium features access
-- 4. Monitor usage tracking accuracy 