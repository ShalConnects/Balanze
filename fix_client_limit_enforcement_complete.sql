-- =====================================================
-- FIX CLIENT LIMIT ENFORCEMENT COMPLETE
-- This ensures subscription_plans has max_clients and trigger works
-- =====================================================

-- Step 1: Ensure subscription_plans table has max_clients set
UPDATE subscription_plans 
SET 
    features = COALESCE(features, '{}'::jsonb) || '{"max_clients": 5}'::jsonb,
    updated_at = NOW()
WHERE name = 'free';

UPDATE subscription_plans 
SET 
    features = COALESCE(features, '{}'::jsonb) || '{"max_clients": -1}'::jsonb,
    updated_at = NOW()
WHERE name = 'premium';

UPDATE subscription_plans 
SET 
    features = COALESCE(features, '{}'::jsonb) || '{"max_clients": -1}'::jsonb,
    updated_at = NOW()
WHERE name = 'premium_lifetime';

-- Step 2: Update get_user_plan_features to ensure max_clients is in defaults
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
    
    -- Ensure max_clients exists in the returned features
    IF NOT (plan_features ? 'max_clients') THEN
        IF user_plan = 'free' THEN
            plan_features := plan_features || '{"max_clients": 5}'::jsonb;
        ELSE
            plan_features := plan_features || '{"max_clients": -1}'::jsonb;
        END IF;
    END IF;
    
    RETURN plan_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION enforce_client_limit()
RETURNS TRIGGER AS $$
DECLARE
    limit_lifetime INTEGER;
    current_count INTEGER;
    plan_features JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get the plan features
        plan_features := get_user_plan_features(NEW.user_id);
        
        -- Get the limit, default to 5 if not found
        limit_lifetime := COALESCE((plan_features->>'max_clients')::INTEGER, 5);
        
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

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS enforce_client_limit_trigger ON clients;
CREATE TRIGGER enforce_client_limit_trigger
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION enforce_client_limit();

-- Step 5: Verify everything is set up
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    free_plan_has_limit BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'enforce_client_limit'
    ) INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'enforce_client_limit_trigger'
    ) INTO trigger_exists;
    
    -- Check if free plan has max_clients
    SELECT (features ? 'max_clients') INTO free_plan_has_limit
    FROM subscription_plans
    WHERE name = 'free';
    
    RAISE NOTICE '=== Client Limit Enforcement Status ===';
    IF function_exists THEN
        RAISE NOTICE '✓ Function: enforce_client_limit exists';
    ELSE
        RAISE WARNING '✗ Function: enforce_client_limit is MISSING';
    END IF;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger: enforce_client_limit_trigger exists';
    ELSE
        RAISE WARNING '✗ Trigger: enforce_client_limit_trigger is MISSING';
    END IF;
    
    IF free_plan_has_limit THEN
        RAISE NOTICE '✓ Free plan has max_clients configured';
    ELSE
        RAISE WARNING '✗ Free plan is MISSING max_clients';
    END IF;
END $$;
