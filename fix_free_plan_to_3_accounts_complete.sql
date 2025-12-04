-- =====================================================
-- COMPLETE FIX: FREE PLAN TO 3 ACCOUNTS
-- This script updates ALL references from 5 accounts to 3 accounts
-- for the free plan across the entire system
-- =====================================================

-- Step 1: Update subscription plans table
UPDATE subscription_plans 
SET 
    features = jsonb_set(features, '{max_accounts}', '3'),
    updated_at = NOW()
WHERE name = 'free';

-- Step 2: Update the main plan features function
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
    
    -- Return default free features if plan not found (NOW WITH 3 ACCOUNTS)
    IF plan_features IS NULL THEN
        plan_features := '{
            "max_accounts": 3,
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

-- Step 3: Update account limit enforcement trigger
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

-- Step 4: Update check_account_limit function to use correct limit
CREATE OR REPLACE FUNCTION check_account_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_accounts INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user's plan features
    plan_features := get_user_plan_features(user_uuid);
    
    -- Get max accounts allowed
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    
    -- If unlimited accounts (-1), always return true
    IF max_accounts = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Count current active accounts
    SELECT COUNT(*) INTO current_count 
    FROM accounts WHERE user_id = user_uuid AND is_active = true;
    
    -- Return true if under limit
    RETURN current_count < max_accounts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate triggers to ensure they use updated functions
DROP TRIGGER IF EXISTS enforce_account_limit_trigger ON accounts;
CREATE TRIGGER enforce_account_limit_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_account_limit();

-- Step 6: Update any other enforcement functions that might reference the old limit
CREATE OR REPLACE FUNCTION test_plan_enforcement(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    result := jsonb_build_object(
        'account_limit_ok', check_account_limit(user_uuid),
        'currency_limit_ok', check_currency_limit(user_uuid),
        'transaction_limit_ok', check_transaction_limit(user_uuid),
        'has_custom_categories', has_feature(user_uuid, 'custom_categories'),
        'has_lend_borrow', has_feature(user_uuid, 'lend_borrow'),
        'has_last_wish', has_feature(user_uuid, 'last_wish'),
        'usage_stats', get_user_usage_stats(user_uuid)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verify the changes
DO $$
DECLARE
    free_plan_features JSONB;
BEGIN
    -- Get the updated free plan features
    SELECT features INTO free_plan_features 
    FROM subscription_plans 
    WHERE name = 'free';
    
    -- Check if max_accounts is now 3
    IF (free_plan_features->>'max_accounts')::INTEGER = 3 THEN
        RAISE NOTICE 'SUCCESS: Free plan max_accounts updated to 3';
    ELSE
        RAISE NOTICE 'ERROR: Free plan max_accounts is still %', free_plan_features->>'max_accounts';
    END IF;
END $$;

-- Step 8: Optional - Handle existing users with more than 3 accounts
-- Uncomment the following if you want to see which users would be affected
/*
SELECT 
    p.id as user_id,
    p.full_name,
    COUNT(a.id) as account_count,
    p.subscription->>'plan' as current_plan
FROM profiles p
LEFT JOIN accounts a ON p.id = a.user_id AND a.is_active = true
WHERE (p.subscription->>'plan' IS NULL OR p.subscription->>'plan' = 'free')
GROUP BY p.id, p.full_name, p.subscription
HAVING COUNT(a.id) > 3
ORDER BY account_count DESC;
*/

-- Final verification query
SELECT 
    name,
    features->>'max_accounts' as max_accounts,
    features->>'max_currencies' as max_currencies,
    features->>'max_transactions' as max_transactions,
    price
FROM subscription_plans 
WHERE name IN ('free', 'premium')
ORDER BY name;
