-- =====================================================
-- STEP 2: FIX PURCHASE LIMIT (50 LIFETIME)
-- Ensure purchase limit works correctly for all users
-- =====================================================

-- Step 1: Update the purchase limit check function
CREATE OR REPLACE FUNCTION check_purchase_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_purchases INTEGER;
    current_count INTEGER;
BEGIN
    plan_features := get_user_plan_features(user_uuid);
    max_purchases := (plan_features->>'max_purchases')::INTEGER;
    
    -- If unlimited, always allow
    IF max_purchases = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Count ALL existing purchases (lifetime)
    SELECT COUNT(*) INTO current_count 
    FROM purchases 
    WHERE user_id = user_uuid;
    
    -- Return true if under limit (strict less than)
    RETURN current_count < max_purchases;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the purchase limit enforcement function
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

-- Step 3: Recreate the purchase limit trigger
DROP TRIGGER IF EXISTS enforce_purchase_limit_trigger ON purchases;
CREATE TRIGGER enforce_purchase_limit_trigger
    BEFORE INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION enforce_purchase_limit();

-- Step 4: Verification
SELECT 'STEP_2_COMPLETE' as status, 
       'Purchase limit (50 lifetime) is now working correctly' as description;
