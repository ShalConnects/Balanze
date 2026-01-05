-- =====================================================
-- ADD CLIENT LIMIT ENFORCEMENT
-- Similar to purchase limits: 5 clients for free, unlimited for premium
-- =====================================================

-- Step 1: Update subscription plans to include max_clients
UPDATE subscription_plans 
SET 
    features = features || '{"max_clients": 5}'::jsonb,
    updated_at = NOW()
WHERE name = 'free';

UPDATE subscription_plans 
SET 
    features = features || '{"max_clients": -1}'::jsonb,
    updated_at = NOW()
WHERE name = 'premium';

UPDATE subscription_plans 
SET 
    features = features || '{"max_clients": -1}'::jsonb,
    updated_at = NOW()
WHERE name = 'premium_lifetime';

-- Step 2: Update get_user_plan_features function to include max_clients in default
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
            "max_clients": 5,
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

-- Step 3: Create function to check client limits
CREATE OR REPLACE FUNCTION check_client_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_clients INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max clients limit
    max_clients := (plan_features->>'max_clients')::INTEGER;
    
    -- If unlimited, always allow
    IF max_clients = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Count ALL existing clients (lifetime)
    SELECT COUNT(*) INTO current_count 
    FROM clients 
    WHERE user_id = user_uuid;
    
    -- Return true if under limit (strict less than)
    RETURN current_count < max_clients;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger function to enforce client limits
CREATE OR REPLACE FUNCTION enforce_client_limit()
RETURNS TRIGGER AS $$
DECLARE
    limit_lifetime INTEGER;
    current_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get the limit
        limit_lifetime := (get_user_plan_features(NEW.user_id)->>'max_clients')::INTEGER;
        
        -- If unlimited, allow
        IF limit_lifetime = -1 THEN
            RETURN NEW;
        END IF;
        
        -- Count ALL existing clients (lifetime)
        SELECT COUNT(*) INTO current_count 
        FROM clients 
        WHERE user_id = NEW.user_id;
        
        -- Check if adding this client would exceed limit
        IF current_count >= limit_lifetime THEN
            RAISE EXCEPTION 'CLIENT_LIMIT_EXCEEDED: Free plan allows % clients lifetime. Upgrade to Premium for unlimited clients.', limit_lifetime;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger on clients table
DROP TRIGGER IF EXISTS enforce_client_limit_trigger ON clients;
CREATE TRIGGER enforce_client_limit_trigger
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION enforce_client_limit();

-- Step 6: Update get_user_usage_stats function to include client statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    account_count INTEGER;
    currency_count INTEGER;
    purchase_count INTEGER;
    client_count INTEGER;
    max_accounts INTEGER;
    max_currencies INTEGER;
    max_purchases INTEGER;
    max_clients INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get limits
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    max_currencies := (plan_features->>'max_currencies')::INTEGER;
    max_purchases := (plan_features->>'max_purchases')::INTEGER;
    max_clients := (plan_features->>'max_clients')::INTEGER;
    
    -- Count current usage
    SELECT COUNT(*) INTO account_count FROM accounts WHERE user_id = user_uuid;
    SELECT COUNT(DISTINCT currency) INTO currency_count FROM accounts WHERE user_id = user_uuid;
    SELECT COUNT(*) INTO purchase_count FROM purchases WHERE user_id = user_uuid;
    SELECT COUNT(*) INTO client_count FROM clients WHERE user_id = user_uuid;
    
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
        'purchases', jsonb_build_object(
            'current', purchase_count,
            'limit', max_purchases,
            'percentage', CASE WHEN max_purchases = -1 THEN 0 ELSE (purchase_count::FLOAT / max_purchases * 100) END
        ),
        'clients', jsonb_build_object(
            'current', client_count,
            'limit', max_clients,
            'percentage', CASE WHEN max_clients = -1 THEN 0 ELSE (client_count::FLOAT / max_clients * 100) END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verification
SELECT 'CLIENT_LIMIT_ENFORCEMENT_ADDED' as status, 
       'Client limits: Free=5, Premium=Unlimited' as description;

