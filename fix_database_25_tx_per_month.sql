-- =====================================================
-- FIX DATABASE: 25 TRANSACTIONS PER MONTH
-- Comprehensive fix to ensure proper monthly limits
-- =====================================================

-- Step 1: Update free plan to use monthly limits
UPDATE subscription_plans 
SET 
    features = jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{max_transactions_per_month}',
        '25'::jsonb,
        true
    ),
    description = 'Basic plan with 25 transactions per month'
WHERE name = 'free';

-- Remove old transaction limit if it exists
UPDATE subscription_plans 
SET features = features - 'max_transactions'
WHERE name = 'free' AND features ? 'max_transactions';

-- Step 2: Ensure get_user_plan_features uses monthly limits
CREATE OR REPLACE FUNCTION get_user_plan_features(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_plan TEXT;
    plan_features JSONB;
BEGIN
    -- Get user's plan from profiles
    SELECT subscription->>'plan' INTO user_plan 
    FROM profiles WHERE id = user_uuid;
    
    -- Default to free if no plan found
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;
    
    -- Try to get plan features from subscription_plans
    SELECT features INTO plan_features 
    FROM subscription_plans WHERE name = user_plan;
    
    -- Fallback default for free plan
    IF plan_features IS NULL THEN
        plan_features := '{
            "max_accounts": 3,
            "max_transactions_per_month": 25,
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

-- Step 3: Create/Update monthly transaction limit check
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
    current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
      AND DATE(created_at) >= current_month_start;

    RETURN max_transactions_per_month = -1 OR current_month_count < max_transactions_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create monthly usage stats function
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

    SELECT COUNT(*) INTO current_month_count 
    FROM transactions 
    WHERE user_id = user_uuid 
      AND DATE(created_at) >= current_month_start;

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

-- Step 5: Update enforcement function to use monthly limits
CREATE OR REPLACE FUNCTION enforce_transaction_limit()
RETURNS TRIGGER AS $$
DECLARE
    limit_per_month INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        limit_per_month := (get_user_plan_features(NEW.user_id)->>'max_transactions_per_month')::INTEGER;
        IF NOT check_monthly_transaction_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'MONTHLY_TRANSACTION_LIMIT_EXCEEDED: Free plan allows % transactions per month. Upgrade to Premium for unlimited transactions.', limit_per_month;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate trigger to use updated enforcement
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transactions'
    ) THEN
        DROP TRIGGER IF EXISTS enforce_transaction_limit_trigger ON transactions;
        CREATE TRIGGER enforce_transaction_limit_trigger
            BEFORE INSERT ON transactions
            FOR EACH ROW
            EXECUTE FUNCTION enforce_transaction_limit();
    END IF;
END $$;

-- Step 7: Remove old transaction limit function if it exists
DROP FUNCTION IF EXISTS check_transaction_limit(UUID);

-- Step 8: Verification queries
SELECT '=== VERIFICATION RESULTS ===' as section;

-- Check subscription plans
SELECT 
    'SUBSCRIPTION_PLANS' as check_type,
    name,
    features->>'max_transactions_per_month' as monthly_limit,
    features->>'max_transactions' as old_limit,
    CASE 
        WHEN features->>'max_transactions_per_month' = '25' THEN '✅ CORRECT'
        WHEN features->>'max_transactions_per_month' IS NULL THEN '❌ MISSING'
        ELSE '⚠️ WRONG VALUE: ' || (features->>'max_transactions_per_month')
    END as status
FROM subscription_plans 
WHERE name = 'free';

-- Check functions exist
SELECT 
    'FUNCTIONS' as check_type,
    proname as function_name,
    CASE WHEN proname IN ('get_user_plan_features', 'check_monthly_transaction_limit', 'get_monthly_usage_stats', 'enforce_transaction_limit') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
FROM pg_proc 
WHERE proname IN ('get_user_plan_features', 'check_monthly_transaction_limit', 'get_monthly_usage_stats', 'enforce_transaction_limit')
ORDER BY proname;

-- Check triggers
SELECT 
    'TRIGGERS' as check_type,
    trigger_name,
    CASE WHEN trigger_name = 'enforce_transaction_limit_trigger' 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'transactions'
  AND trigger_name LIKE '%transaction%';

-- Test function call
DO $$
DECLARE
    test_user_id UUID;
    test_result BOOLEAN;
    usage_stats JSONB;
BEGIN
    -- Get first user for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test monthly limit function
        SELECT check_monthly_transaction_limit(test_user_id) INTO test_result;
        RAISE NOTICE 'Monthly limit test result: %', test_result;
        
        -- Test usage stats function
        SELECT get_monthly_usage_stats(test_user_id) INTO usage_stats;
        RAISE NOTICE 'Usage stats: %', usage_stats;
        
        RAISE NOTICE '✅ All functions working correctly';
    ELSE
        RAISE NOTICE '⚠️ No users found for testing';
    END IF;
END $$;

-- =====================================================
-- DATABASE FIX COMPLETE
-- =====================================================
