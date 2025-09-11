-- =====================================================
-- CREATE PLAN ENFORCEMENT FUNCTIONS
-- Functions to check and enforce plan limits
-- =====================================================

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