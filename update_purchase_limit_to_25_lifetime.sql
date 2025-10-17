-- =====================================================
-- UPDATE PURCHASE LIMIT TO 25 LIFETIME
-- Change from 50 purchases to 25 purchases lifetime (no monthly reset)
-- =====================================================

-- Step 1: Update free plan to use 25 purchases lifetime
UPDATE subscription_plans 
SET 
    features = jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{max_purchases}',
        '25'::jsonb,
        true
    ),
    description = 'Basic plan with 25 purchases lifetime'
WHERE name = 'free';

-- Step 2: Update the default free plan features in get_user_plan_features function
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
            "max_transactions_per_month": 25,
            "max_currencies": 1,
            "max_purchases": 25,
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

-- Step 3: Update the purchase limit check function (no monthly reset)
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
    
    -- If unlimited, always allow
    IF max_purchases = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Count ALL purchases (lifetime, no date restriction)
    SELECT COUNT(*) INTO current_count 
    FROM purchases 
    WHERE user_id = user_uuid;
    
    -- Return true if under limit (strict less than)
    RETURN current_count < max_purchases;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update the purchase limit enforcement function
CREATE OR REPLACE FUNCTION enforce_purchase_limit()
RETURNS TRIGGER AS $$
DECLARE
    limit_lifetime INTEGER;
    current_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get the limit
        limit_lifetime := (get_user_plan_features(NEW.user_id)->>'max_purchases')::INTEGER;
        
        -- If unlimited, allow
        IF limit_lifetime = -1 THEN
            RETURN NEW;
        END IF;
        
        -- Count ALL existing purchases (lifetime)
        SELECT COUNT(*) INTO current_count 
        FROM purchases 
        WHERE user_id = NEW.user_id;
        
        -- Check if adding this purchase would exceed limit
        IF current_count >= limit_lifetime THEN
            RAISE EXCEPTION 'PURCHASE_LIMIT_EXCEEDED: Free plan allows % purchases lifetime. Upgrade to Premium for unlimited purchases.', limit_lifetime;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the purchase limit trigger
DROP TRIGGER IF EXISTS enforce_purchase_limit_trigger ON purchases;
CREATE TRIGGER enforce_purchase_limit_trigger
    BEFORE INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION enforce_purchase_limit();

-- Step 6: Update usage stats function to reflect lifetime purchase limit
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
    
    -- Get current counts
    SELECT COUNT(*) INTO account_count FROM accounts WHERE user_id = user_uuid AND is_active = true;
    SELECT COUNT(DISTINCT currency) INTO currency_count FROM accounts WHERE user_id = user_uuid AND is_active = true;
    
    -- Count regular transactions (exclude purchase transactions)
    SELECT COUNT(*) INTO transaction_count 
    FROM transactions 
    WHERE user_id = user_uuid 
      AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)::DATE
      AND NOT ('purchase' = ANY(tags));
    
    -- Count ALL purchases (lifetime)
    SELECT COUNT(*) INTO purchase_count FROM purchases WHERE user_id = user_uuid;
    
    -- Get limits
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    max_currencies := (plan_features->>'max_currencies')::INTEGER;
    max_transactions := (plan_features->>'max_transactions_per_month')::INTEGER;
    max_purchases := (plan_features->>'max_purchases')::INTEGER;
    
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

-- Step 7: Verification
SELECT 'PURCHASE_LIMIT_UPDATED' as status, 
       '25 purchases lifetime (no monthly reset)' as description,
       '25 regular transactions per month + 25 purchases lifetime' as limits;
