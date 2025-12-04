-- =====================================================
-- ADD PURCHASE LIMIT ENFORCEMENT
-- Add purchase limits to plan system (50 for free, unlimited for premium)
-- =====================================================

-- Step 1: Update plan features to include max_purchases
-- Update Free plan to include purchase limit
UPDATE subscription_plans 
SET features = jsonb_set(
    features,
    '{max_purchases}',
    '50'
)
WHERE name = 'free';

-- Update Premium plan to include unlimited purchases
UPDATE subscription_plans 
SET features = jsonb_set(
    features,
    '{max_purchases}',
    '-1'
)
WHERE name = 'premium';

-- Update Premium Lifetime plan to include unlimited purchases
UPDATE subscription_plans 
SET features = jsonb_set(
    features,
    '{max_purchases}',
    '-1'
)
WHERE name = 'premium_lifetime';

-- Step 2: Update get_user_plan_features function to include max_purchases
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
            "max_accounts": 3,
            "max_transactions": 100,
            "max_currencies": 1,
            "max_purchases": 50,
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

-- Step 3: Create function to check purchase limits
CREATE OR REPLACE FUNCTION check_purchase_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_purchases INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max purchases limit
    max_purchases := (plan_features->>'max_purchases')::INTEGER;
    
    -- Count current purchases (all purchases, not just excluded ones)
    -- We count all because even excluded purchases use storage and processing
    SELECT COUNT(*) INTO current_count 
    FROM purchases 
    WHERE user_id = user_uuid;
    
    -- Check limit (-1 means unlimited)
    RETURN max_purchases = -1 OR current_count < max_purchases;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger function to enforce purchase limits
CREATE OR REPLACE FUNCTION enforce_purchase_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new purchase creation
    IF TG_OP = 'INSERT' THEN
        -- Check purchase limit
        IF NOT check_purchase_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'PURCHASE_LIMIT_EXCEEDED: Free plan allows up to 50 purchases. Upgrade to Premium for unlimited purchases.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger on purchases table
DROP TRIGGER IF EXISTS enforce_purchase_limit_trigger ON purchases;
CREATE TRIGGER enforce_purchase_limit_trigger
    BEFORE INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION enforce_purchase_limit();

-- Step 6: Update get_user_usage_stats function to include purchase stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    account_count INTEGER;
    currency_count INTEGER;
    transaction_count INTEGER;
    purchase_count INTEGER;
    max_accounts INTEGER;
    max_currencies INTEGER;
    max_transactions INTEGER;
    max_purchases INTEGER;
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
    
    SELECT COUNT(*) INTO purchase_count 
    FROM purchases WHERE user_id = user_uuid;
    
    -- Get limits
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    max_currencies := (plan_features->>'max_currencies')::INTEGER;
    max_transactions := (plan_features->>'max_transactions')::INTEGER;
    max_purchases := (plan_features->>'max_purchases')::INTEGER;
    
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
        ),
        'purchases', jsonb_build_object(
            'current', purchase_count,
            'limit', max_purchases,
            'percentage', CASE WHEN max_purchases = -1 THEN 0 ELSE (purchase_count::FLOAT / max_purchases * 100) END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification queries
SELECT 
    'PURCHASE LIMIT ENFORCEMENT' as status,
    name as plan_name,
    features->>'max_purchases' as max_purchases
FROM subscription_plans 
WHERE is_active = true
ORDER BY name;

SELECT 
    'ENFORCEMENT FUNCTIONS' as check_type,
    'check_purchase_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_purchase_limit') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

