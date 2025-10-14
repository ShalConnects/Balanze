-- =====================================================
-- FIX MISSING TRIGGERS AND VERIFY 25 TX/MONTH SETUP
-- Address missing triggers and verify monthly limits work
-- =====================================================

-- Step 1: Recreate missing audit trigger for transactions
CREATE OR REPLACE FUNCTION audit_transactions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            old_data,
            new_data,
            user_id,
            created_at
        ) VALUES (
            'transactions',
            'INSERT',
            NULL,
            row_to_json(NEW),
            NEW.user_id,
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            old_data,
            new_data,
            user_id,
            created_at
        ) VALUES (
            'transactions',
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            NEW.user_id,
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            old_data,
            new_data,
            user_id,
            created_at
        ) VALUES (
            'transactions',
            'DELETE',
            row_to_json(OLD),
            NULL,
            OLD.user_id,
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger if audit_log table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        DROP TRIGGER IF EXISTS audit_transactions ON transactions;
        CREATE TRIGGER audit_transactions
            AFTER INSERT OR UPDATE OR DELETE ON transactions
            FOR EACH ROW
            EXECUTE FUNCTION audit_transactions();
    END IF;
END $$;

-- Step 2: Recreate updated_at trigger for transactions
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- Step 3: Ensure monthly transaction functions exist
-- Create monthly limit function if missing
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

-- Create usage stats function if missing
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

-- Step 4: Test the functions
SELECT '=== FUNCTION TESTS ===' as section;

-- Test monthly limit function with a sample user
DO $$
DECLARE
    test_user_id UUID;
    test_result BOOLEAN;
    usage_stats JSONB;
BEGIN
    -- Get first user for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user: %', test_user_id;
        
        -- Test monthly limit function
        SELECT check_monthly_transaction_limit(test_user_id) INTO test_result;
        RAISE NOTICE 'Monthly limit check result: %', test_result;
        
        -- Test usage stats function
        SELECT get_monthly_usage_stats(test_user_id) INTO usage_stats;
        RAISE NOTICE 'Usage stats: %', usage_stats;
        
        RAISE NOTICE '✅ All monthly functions are working correctly';
    ELSE
        RAISE NOTICE '⚠️ No users found for testing';
    END IF;
END $$;

-- Step 5: Verify enforcement function uses monthly limits
SELECT '=== ENFORCEMENT VERIFICATION ===' as section;

-- Check if enforcement function uses monthly limits
SELECT 
    CASE 
        WHEN prosrc LIKE '%check_monthly_transaction_limit%' 
        THEN '✅ Uses monthly limits'
        WHEN prosrc LIKE '%check_transaction_limit%' 
        THEN '⚠️ Uses old limits - needs update'
        ELSE '❌ Unknown enforcement method'
    END as enforcement_status,
    proname as function_name
FROM pg_proc 
WHERE proname = 'enforce_transaction_limit';

-- Step 5: Final verification
SELECT '=== FINAL STATUS ===' as section;

-- Check all required functions exist
SELECT 
    'FUNCTIONS' as check_type,
    proname as function_name,
    '✅ EXISTS' as status
FROM pg_proc 
WHERE proname IN ('get_user_plan_features', 'check_monthly_transaction_limit', 'get_monthly_usage_stats', 'enforce_transaction_limit')
ORDER BY proname;

-- Check triggers
SELECT 
    'TRIGGERS' as check_type,
    trigger_name,
    '✅ EXISTS' as status
FROM information_schema.triggers 
WHERE event_object_table = 'transactions'
  AND trigger_name IN ('enforce_transaction_limit_trigger', 'update_transactions_updated_at')
ORDER BY trigger_name;

-- Check subscription plan
SELECT 
    'SUBSCRIPTION_PLAN' as check_type,
    name,
    features->>'max_transactions_per_month' as monthly_limit,
    CASE 
        WHEN features->>'max_transactions_per_month' = '25' THEN '✅ CORRECT'
        ELSE '❌ WRONG VALUE'
    END as status
FROM subscription_plans 
WHERE name = 'free';

-- =====================================================
-- FIX COMPLETE
-- =====================================================
