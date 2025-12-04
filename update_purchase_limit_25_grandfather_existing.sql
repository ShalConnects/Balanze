-- =====================================================
-- UPDATE PURCHASE LIMIT TO 25 LIFETIME - GRANDFATHER EXISTING USERS
-- New users: 25 purchases lifetime
-- Existing users: Keep their current limit (50 or whatever they had)
-- =====================================================

-- Step 1: Update free plan to use 25 purchases lifetime for NEW users only
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

-- Step 2: Create a function to get user-specific purchase limits (grandfathering)
CREATE OR REPLACE FUNCTION get_user_purchase_limit(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_created_at TIMESTAMP;
    current_purchase_count INTEGER;
    plan_features JSONB;
    default_limit INTEGER;
BEGIN
    -- Get user creation date
    SELECT created_at INTO user_created_at 
    FROM auth.users 
    WHERE id = user_uuid;
    
    -- Get current purchase count
    SELECT COUNT(*) INTO current_purchase_count 
    FROM purchases 
    WHERE user_id = user_uuid;
    
    -- Get plan features for default limit
    plan_features := get_user_plan_features(user_uuid);
    default_limit := (plan_features->>'max_purchases')::INTEGER;
    
    -- Grandfathering logic:
    -- If user was created before this change AND has more than 25 purchases, keep their current limit
    -- Otherwise, use the new limit (25)
    IF user_created_at < '2024-01-01'::TIMESTAMP AND current_purchase_count > 25 THEN
        -- Grandfather existing users with more than 25 purchases
        RETURN GREATEST(current_purchase_count + 5, 50); -- Give them 5 more than current, minimum 50
    ELSE
        -- New users or users with 25 or fewer purchases get the new limit
        RETURN default_limit;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update the purchase limit check function to use grandfathered limits
CREATE OR REPLACE FUNCTION check_purchase_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_limit INTEGER;
    current_count INTEGER;
BEGIN
    -- Get user-specific limit (with grandfathering)
    user_limit := get_user_purchase_limit(user_uuid);
    
    -- If unlimited, always allow
    IF user_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Count ALL purchases (lifetime, no date restriction)
    SELECT COUNT(*) INTO current_count 
    FROM purchases 
    WHERE user_id = user_uuid;
    
    -- Return true if under limit (strict less than)
    RETURN current_count < user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update the purchase limit enforcement function
CREATE OR REPLACE FUNCTION enforce_purchase_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_limit INTEGER;
    current_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get user-specific limit (with grandfathering)
        user_limit := get_user_purchase_limit(NEW.user_id);
        
        -- If unlimited, allow
        IF user_limit = -1 THEN
            RETURN NEW;
        END IF;
        
        -- Count ALL existing purchases (lifetime)
        SELECT COUNT(*) INTO current_count 
        FROM purchases 
        WHERE user_id = NEW.user_id;
        
        -- Check if adding this purchase would exceed limit
        IF current_count >= user_limit THEN
            RAISE EXCEPTION 'PURCHASE_LIMIT_EXCEEDED: Free plan allows % purchases lifetime. Upgrade to Premium for unlimited purchases.', user_limit;
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

-- Step 6: Update usage stats function to reflect grandfathered limits
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    account_count INTEGER;
    currency_count INTEGER;
    transaction_count INTEGER;
    purchase_count INTEGER;
    purchase_limit INTEGER;
    max_accounts INTEGER;
    max_currencies INTEGER;
    max_transactions INTEGER;
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
    
    -- Get user-specific purchase limit (with grandfathering)
    purchase_limit := get_user_purchase_limit(user_uuid);
    
    -- Get other limits
    max_accounts := (plan_features->>'max_accounts')::INTEGER;
    max_currencies := (plan_features->>'max_currencies')::INTEGER;
    max_transactions := (plan_features->>'max_transactions_per_month')::INTEGER;
    
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
            'limit', purchase_limit,
            'percentage', CASE WHEN purchase_limit = -1 THEN 0 ELSE (purchase_count::FLOAT / purchase_limit * 100) END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a function to check if user is grandfathered
CREATE OR REPLACE FUNCTION is_user_grandfathered(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_created_at TIMESTAMP;
    current_purchase_count INTEGER;
BEGIN
    -- Get user creation date
    SELECT created_at INTO user_created_at 
    FROM auth.users 
    WHERE id = user_uuid;
    
    -- Get current purchase count
    SELECT COUNT(*) INTO current_purchase_count 
    FROM purchases 
    WHERE user_id = user_uuid;
    
    -- User is grandfathered if they were created before this change AND have more than 25 purchases
    RETURN user_created_at < '2024-01-01'::TIMESTAMP AND current_purchase_count > 25;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Verification queries
SELECT 'GRANDFATHERING_APPLIED' as status, 
       'Existing users keep their limits, new users get 25 purchases' as description;

-- Check how many users will be grandfathered
SELECT 
    'GRANDFATHERED_USERS' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_user_grandfathered(id) THEN 1 END) as grandfathered_users,
    COUNT(CASE WHEN NOT is_user_grandfathered(id) THEN 1 END) as new_limit_users
FROM auth.users;
