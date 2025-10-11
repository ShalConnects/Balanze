-- =====================================================
-- UPDATE TO MONTHLY TRANSACTION LIMITS
-- Change from 100 total to 50 per month for free plan
-- =====================================================

-- Step 1: Update Free plan to use monthly limits
UPDATE subscription_plans 
SET 
    features = '{
        "max_accounts": 5,
        "max_transactions_per_month": 50,
        "max_currencies": 1,
        "analytics": false,
        "priority_support": false,
        "export_data": false,
        "custom_categories": false,
        "lend_borrow": false,
        "last_wish": false,
        "advanced_charts": false,
        "advanced_reporting": false,
        "ads_enabled": true
    }'::jsonb,
    price = 0.00,
    description = 'Basic plan with 50 transactions per month and ads',
    updated_at = NOW()
WHERE name = 'free';

-- Step 2: Update Premium plan to remove ads
UPDATE subscription_plans 
SET 
    features = '{
        "max_accounts": -1,
        "max_transactions_per_month": -1,
        "max_currencies": -1,
        "analytics": true,
        "priority_support": true,
        "export_data": true,
        "custom_categories": true,
        "lend_borrow": true,
        "last_wish": true,
        "advanced_charts": true,
        "advanced_reporting": true,
        "ads_enabled": false
    }'::jsonb,
    price = 7.99,
    description = 'Premium plan with unlimited transactions and no ads',
    updated_at = NOW()
WHERE name = 'premium';

-- Step 3: Update Lifetime plan to remove ads
UPDATE subscription_plans 
SET 
    features = '{
        "max_accounts": -1,
        "max_transactions_per_month": -1,
        "max_currencies": -1,
        "analytics": true,
        "priority_support": true,
        "export_data": true,
        "custom_categories": true,
        "lend_borrow": true,
        "last_wish": true,
        "advanced_charts": true,
        "advanced_reporting": true,
        "ads_enabled": false
    }'::jsonb,
    price = 199.99,
    description = 'Lifetime Premium plan with unlimited transactions and no ads',
    updated_at = NOW()
WHERE name = 'premium_lifetime';

-- Step 4: Create new function for monthly transaction limits
CREATE OR REPLACE FUNCTION check_monthly_transaction_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_transactions_per_month INTEGER;
    current_month_count INTEGER;
    current_month_start DATE;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max transactions per month limit
    max_transactions_per_month := (plan_features->>'max_transactions_per_month')::INTEGER;
    
    -- Get current month start date
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- Count transactions for current month
    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
    AND DATE(created_at) >= current_month_start;
    
    -- Check limit (-1 means unlimited)
    RETURN max_transactions_per_month = -1 OR current_month_count < max_transactions_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to get monthly usage stats
CREATE OR REPLACE FUNCTION get_monthly_usage_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    current_month_count INTEGER;
    max_transactions_per_month INTEGER;
    current_month_start DATE;
    days_remaining INTEGER;
    transactions_remaining INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get current month start date
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- Count transactions for current month
    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
    AND DATE(created_at) >= current_month_start;
    
    -- Get limits
    max_transactions_per_month := (plan_features->>'max_transactions_per_month')::INTEGER;
    
    -- Calculate days remaining in month
    days_remaining := EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' - CURRENT_DATE));
    
    -- Calculate transactions remaining
    transactions_remaining := CASE 
        WHEN max_transactions_per_month = -1 THEN -1
        ELSE GREATEST(0, max_transactions_per_month - current_month_count)
    END;
    
    -- Return usage stats
    RETURN jsonb_build_object(
        'current_month_transactions', current_month_count,
        'max_transactions_per_month', max_transactions_per_month,
        'transactions_remaining', transactions_remaining,
        'days_remaining_in_month', days_remaining,
        'percentage_used', CASE 
            WHEN max_transactions_per_month = -1 THEN 0 
            ELSE (current_month_count::FLOAT / max_transactions_per_month * 100) 
        END,
        'reset_date', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update transaction limit trigger for monthly limits
CREATE OR REPLACE FUNCTION enforce_transaction_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new transaction creation
    IF TG_OP = 'INSERT' THEN
        -- Check monthly transaction limit
        IF NOT check_monthly_transaction_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'MONTHLY_TRANSACTION_LIMIT_EXCEEDED: Free plan allows 50 transactions per month. Upgrade to Premium for unlimited transactions.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to check if user has ads enabled
CREATE OR REPLACE FUNCTION has_ads_enabled(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    ads_enabled BOOLEAN;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get ads enabled value
    ads_enabled := (plan_features->>'ads_enabled')::BOOLEAN;
    
    -- Return false if ads not found or false
    RETURN COALESCE(ads_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to get ad configuration
CREATE OR REPLACE FUNCTION get_ad_configuration(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    ads_enabled BOOLEAN;
    user_platform TEXT;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get ads enabled value
    ads_enabled := (plan_features->>'ads_enabled')::BOOLEAN;
    
    -- Determine platform (this would be passed from frontend)
    -- For now, return generic config
    RETURN jsonb_build_object(
        'ads_enabled', COALESCE(ads_enabled, false),
        'ad_networks', CASE 
            WHEN ads_enabled THEN jsonb_build_object(
                'mobile', jsonb_build_array('admob', 'facebook_audience_network'),
                'web', jsonb_build_array('adsense', 'media_net')
            )
            ELSE jsonb_build_object()
        END,
        'ad_placement', CASE 
            WHEN ads_enabled THEN jsonb_build_object(
                'banner_ads', true,
                'interstitial_ads', true,
                'rewarded_video_ads', true,
                'native_ads', true
            )
            ELSE jsonb_build_object()
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Verify the updates
SELECT 
    'MONTHLY LIMITS UPDATE COMPLETE' as status,
    name,
    features->>'max_transactions_per_month' as monthly_limit,
    features->>'ads_enabled' as ads_enabled,
    price
FROM subscription_plans 
WHERE is_active = true
ORDER BY price;

-- Step 10: Test the new functions
SELECT 
    'FUNCTION TESTS' as test_type,
    'check_monthly_transaction_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_monthly_transaction_limit') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'FUNCTION TESTS' as test_type,
    'get_monthly_usage_stats' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_monthly_usage_stats') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'FUNCTION TESTS' as test_type,
    'has_ads_enabled' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_ads_enabled') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'FUNCTION TESTS' as test_type,
    'get_ad_configuration' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_ad_configuration') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- MONTHLY LIMITS + ADS IMPLEMENTATION COMPLETE
-- =====================================================
