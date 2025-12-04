-- =====================================================
-- FIX TRANSACTION LIMIT TO EXCLUDE PURCHASE TRANSACTIONS
-- Allow 25 regular transactions + unlimited purchase transactions
-- =====================================================

-- Step 1: Update the monthly transaction limit check to exclude purchase transactions
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

    -- Count existing transactions for current month (EXCLUDE purchase transactions)
    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
      AND DATE(created_at) >= current_month_start
      AND NOT ('purchase' = ANY(tags)); -- Exclude transactions with 'purchase' tag

    -- Return true if under limit (strict less than)
    RETURN current_month_count < max_transactions_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the enforcement function to be more explicit
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
        
        -- Count existing transactions (EXCLUDE purchase transactions)
        SELECT COUNT(*) INTO current_count 
        FROM transactions 
        WHERE user_id = NEW.user_id 
          AND DATE(created_at) >= current_month_start
          AND NOT ('purchase' = ANY(tags)); -- Exclude transactions with 'purchase' tag
        
        -- Check if adding this transaction would exceed limit
        IF current_count >= limit_per_month THEN
            RAISE EXCEPTION 'MONTHLY_TRANSACTION_LIMIT_EXCEEDED: Free plan allows % regular transactions per month. Purchase transactions don''t count toward this limit. Upgrade to Premium for unlimited transactions.', limit_per_month;
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

-- Step 4: Update the monthly usage stats function to reflect the new logic
CREATE OR REPLACE FUNCTION get_monthly_usage_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    plan_features JSONB;
    current_month_count INTEGER;
    max_transactions_per_month INTEGER;
    current_month_start DATE;
    days_remaining INTEGER;
    transactions_remaining INTEGER;
BEGIN
    plan_features := get_user_plan_features(user_uuid);
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Count regular transactions (EXCLUDE purchase transactions)
    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
      AND DATE(created_at) >= current_month_start
      AND NOT ('purchase' = ANY(tags)); -- Exclude transactions with 'purchase' tag

    max_transactions_per_month := (plan_features->>'max_transactions_per_month')::INTEGER;

    days_remaining := EXTRACT(DAY FROM (
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' - CURRENT_DATE
    ));

    transactions_remaining := CASE 
        WHEN max_transactions_per_month = -1 THEN -1
        ELSE GREATEST(0, max_transactions_per_month - current_month_count)
    END;

    RETURN jsonb_build_object(
        'current_month_transactions', current_month_count,
        'max_transactions_per_month', max_transactions_per_month,
        'transactions_remaining', transactions_remaining,
        'days_remaining_in_month', days_remaining,
        'percentage_used', CASE 
            WHEN max_transactions_per_month = -1 THEN 0 
            ELSE (current_month_count::FLOAT / max_transactions_per_month * 100) 
        END,
        'reset_date', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verification
SELECT 'TRANSACTION_LIMIT_FIXED' as status, 
       'Regular transactions only (excludes purchase transactions)' as description,
       '25 regular transactions + unlimited purchase transactions' as limit_info;
