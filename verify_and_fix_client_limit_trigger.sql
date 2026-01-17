-- =====================================================
-- VERIFY AND FIX CLIENT LIMIT TRIGGER
-- This script creates/replaces the trigger function and trigger
-- =====================================================

-- Step 1: Create or replace the trigger function
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

-- Step 2: Create or replace the trigger
DROP TRIGGER IF EXISTS enforce_client_limit_trigger ON clients;
CREATE TRIGGER enforce_client_limit_trigger
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION enforce_client_limit();

-- Step 3: Verify the trigger is working
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
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
    
    IF function_exists AND trigger_exists THEN
        RAISE NOTICE 'Client limit enforcement is properly configured';
        RAISE NOTICE '   - Function: enforce_client_limit exists';
        RAISE NOTICE '   - Trigger: enforce_client_limit_trigger exists';
    ELSE
        RAISE WARNING 'Client limit enforcement is NOT properly configured';
        IF NOT function_exists THEN
            RAISE WARNING '   - Function: enforce_client_limit is MISSING';
        END IF;
        IF NOT trigger_exists THEN
            RAISE WARNING '   - Trigger: enforce_client_limit_trigger is MISSING';
        END IF;
    END IF;
END $$;
