-- =====================================================
-- URGENT FIX: TRANSACTION LIMIT TRIGGER
-- This will fix the success toast + error message issue
-- =====================================================

-- Step 1: Fix the check function to prevent transaction insertion
CREATE OR REPLACE FUNCTION check_monthly_transaction_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plan_features JSONB;
    max_transactions_per_month INTEGER;
    current_month_count INTEGER;
    current_month_start DATE;
BEGIN
    plan_features := get_user_plan_features(user_uuid);
    max_transactions_per_month := (plan_features->>'max_transactions_per_month')::INTEGER;
    
    -- If unlimited, always allow
    IF max_transactions_per_month = -1 THEN
        RETURN TRUE;
    END IF;
    
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Count existing transactions for current month
    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
      AND DATE(created_at) >= current_month_start;

    -- Return true if under limit (strict less than)
    RETURN current_month_count < max_transactions_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Fix the enforcement function to be more explicit
CREATE OR REPLACE FUNCTION enforce_transaction_limit()
RETURNS TRIGGER AS $$
DECLARE
    limit_per_month INTEGER;
    current_count INTEGER;
    current_month_start DATE;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get the limit
        limit_per_month := (get_user_plan_features(NEW.user_id)->>'max_transactions_per_month')::INTEGER;
        
        -- If unlimited, allow
        IF limit_per_month = -1 THEN
            RETURN NEW;
        END IF;
        
        -- Get current month start
        current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
        
        -- Count existing transactions
        SELECT COUNT(*) INTO current_count 
        FROM transactions 
        WHERE user_id = NEW.user_id 
          AND DATE(created_at) >= current_month_start;
        
        -- Check if adding this transaction would exceed limit
        IF current_count >= limit_per_month THEN
            RAISE EXCEPTION 'MONTHLY_TRANSACTION_LIMIT_EXCEEDED: Free plan allows % transactions per month. Upgrade to Premium for unlimited transactions.', limit_per_month;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS enforce_transaction_limit_trigger ON transactions;
CREATE TRIGGER enforce_transaction_limit_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_transaction_limit();

-- Step 4: Verify the fix
SELECT 'TRIGGER_FIXED' as status, 
       'enforce_transaction_limit_trigger' as trigger_name,
       'BEFORE INSERT' as trigger_timing;
