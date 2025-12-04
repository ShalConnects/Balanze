-- =====================================================
-- SET FREE PLAN TO 25 TRANSACTIONS PER MONTH
-- Switch enforcement from lifetime 100 to monthly 25
-- Safe to re-run (idempotent via CREATE OR REPLACE)
-- =====================================================

-- Step 1: Ensure default free plan features include monthly cap (for users without explicit plan row)
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

-- Step 3b: Provide monthly usage stats for UI and monitoring
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

-- Step 2: Set free plan in subscription_plans to 25 per month
UPDATE subscription_plans 
SET 
    features = jsonb_set(
        COALESCE(features, '{}'::jsonb),
        '{max_transactions_per_month}',
        '25'::jsonb,
        true
    ),
    description = COALESCE(NULLIF(description, ''), 'Basic plan with 25 transactions per month')
WHERE name = 'free';

-- Step 3: Monthly transaction limit check function (idempotent)
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

-- Step 4: Enforce monthly limit on transactions with dynamic message
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

-- Step 5: Recreate trigger to use updated enforcement
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

-- Step 6: Verifications
-- Free plan monthly cap
SELECT 'VERIFICATION' AS tag, name, features->>'max_transactions_per_month' AS monthly_cap
FROM subscription_plans WHERE name = 'free';

-- Functions exist
SELECT 'FUNC_EXISTS' AS tag, proname
FROM pg_proc 
WHERE proname IN ('get_user_plan_features', 'check_monthly_transaction_limit', 'enforce_transaction_limit')
ORDER BY proname;

-- Sample usage stats check availability (function presence only)
SELECT 'HAS_USAGE_STATS_FN' AS tag,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_monthly_usage_stats') THEN 'YES' ELSE 'NO' END AS get_monthly_usage_stats;

-- =====================================================
-- END: FREE PLAN 25 TRANSACTIONS PER MONTH
-- =====================================================


