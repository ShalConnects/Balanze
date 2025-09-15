-- Simple step-by-step account limit update

-- Step 1: Update the function
CREATE OR REPLACE FUNCTION get_user_plan_features(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_plan TEXT;
    plan_features JSONB;
BEGIN
    SELECT subscription->>'plan' INTO user_plan 
    FROM profiles WHERE id = user_uuid;
    
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;
    
    SELECT features INTO plan_features 
    FROM subscription_plans WHERE name = user_plan;
    
    IF plan_features IS NULL THEN
        plan_features := '{"max_accounts": 3}'::jsonb;
    END IF;
    
    RETURN plan_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the trigger
CREATE OR REPLACE FUNCTION enforce_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NOT check_account_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'ACCOUNT_LIMIT_EXCEEDED: Free plan allows up to 3 accounts. Upgrade to Premium for unlimited accounts.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update existing free plan
UPDATE subscription_plans 
SET features = jsonb_set(features, '{max_accounts}', '3')
WHERE name = 'free';
