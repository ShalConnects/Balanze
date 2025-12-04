-- =====================================================
-- DATABASE REVIEW: 25 TRANSACTIONS PER MONTH SETUP
-- Comprehensive check of current database state
-- =====================================================

-- Step 1: Check subscription plans configuration
SELECT '=== SUBSCRIPTION PLANS ===' as section;

SELECT 
    name,
    features->>'max_transactions_per_month' as monthly_limit,
    features->>'max_transactions' as old_limit,
    features->>'max_accounts' as account_limit,
    features->>'max_currencies' as currency_limit,
    price,
    is_active
FROM subscription_plans 
WHERE is_active = true
ORDER BY price;

-- Step 2: Check if monthly transaction functions exist
SELECT '=== MONTHLY FUNCTIONS ===' as section;

SELECT 
    'check_monthly_transaction_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_monthly_transaction_limit') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'get_monthly_usage_stats' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_monthly_usage_stats') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'get_user_plan_features' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_plan_features') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status;

-- Step 3: Check enforcement functions
SELECT '=== ENFORCEMENT FUNCTIONS ===' as section;

SELECT 
    'enforce_transaction_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'enforce_transaction_limit') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'check_transaction_limit' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_transaction_limit') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status;

-- Step 4: Check triggers
SELECT '=== TRIGGERS ===' as section;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'transactions'
  AND trigger_name LIKE '%transaction%'
ORDER BY trigger_name;

-- Step 5: Test monthly limit function (if exists)
SELECT '=== FUNCTION TESTS ===' as section;

-- Test if we can call the monthly function
DO $$
DECLARE
    test_result BOOLEAN;
    test_user_id UUID;
BEGIN
    -- Get a test user ID (first user in auth.users)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test monthly limit function
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_monthly_transaction_limit') THEN
            SELECT check_monthly_transaction_limit(test_user_id) INTO test_result;
            RAISE NOTICE 'Monthly limit function test: %', test_result;
        ELSE
            RAISE NOTICE 'Monthly limit function: NOT FOUND';
        END IF;
        
        -- Test usage stats function
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_monthly_usage_stats') THEN
            RAISE NOTICE 'Usage stats function: AVAILABLE';
        ELSE
            RAISE NOTICE 'Usage stats function: NOT FOUND';
        END IF;
    ELSE
        RAISE NOTICE 'No test user found';
    END IF;
END $$;

-- Step 6: Check for old transaction limit references
SELECT '=== OLD LIMIT REFERENCES ===' as section;

-- Look for any remaining references to 100 transaction limit
SELECT 
    'Old limit references found' as issue,
    COUNT(*) as count
FROM pg_proc 
WHERE prosrc LIKE '%100 transactions%' 
   OR prosrc LIKE '%up to 100%';

-- Step 7: Check current enforcement message
SELECT '=== ENFORCEMENT MESSAGES ===' as section;

-- Get the current enforcement function source
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'enforce_transaction_limit';

-- Step 8: Recommendations
SELECT '=== RECOMMENDATIONS ===' as section;

-- Check if free plan has monthly limit
SELECT 
    CASE 
        WHEN features->>'max_transactions_per_month' IS NOT NULL 
        THEN '✅ Free plan has monthly limit: ' || (features->>'max_transactions_per_month')
        ELSE '❌ Free plan missing monthly limit'
    END as free_plan_status
FROM subscription_plans 
WHERE name = 'free';

-- Check if old limit still exists
SELECT 
    CASE 
        WHEN features->>'max_transactions' IS NOT NULL 
        THEN '⚠️ Old limit still exists: ' || (features->>'max_transactions')
        ELSE '✅ Old limit removed'
    END as old_limit_status
FROM subscription_plans 
WHERE name = 'free';

-- =====================================================
-- END DATABASE REVIEW
-- =====================================================
