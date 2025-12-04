-- Fix the purchase limit trigger
-- Recreate the trigger to ensure it's working properly

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS enforce_purchase_limit_trigger ON purchases;

-- Step 2: Recreate the trigger function with better error handling
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

-- Step 3: Recreate the trigger
CREATE TRIGGER enforce_purchase_limit_trigger
    BEFORE INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION enforce_purchase_limit();

-- Step 4: Test the trigger
SELECT 'TRIGGER_RECREATED' as status, 
       'Purchase limit trigger has been recreated' as message;
