-- =====================================================
-- UPDATE PURCHASE LIMIT TO 50 LIFETIME
-- Give users 50 purchases lifetime (no monthly reset)
-- =====================================================

-- Step 1: Update free plan to use 50 purchases lifetime
UPDATE subscription_plans 
SET 
    features = jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{max_purchases}',
        '50'::jsonb,
        true
    ),
    description = 'Basic plan with 50 purchases lifetime'
WHERE name = 'free';

-- Step 2: Update the default free plan features
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

-- Step 3: Update the purchase limit check function
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

-- Step 6: Verification
SELECT 'PURCHASE_LIMIT_UPDATED' as status, 
       '50 purchases lifetime (no monthly reset)' as description,
       '25 regular transactions per month + 50 purchases lifetime' as limits;
