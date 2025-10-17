-- Debug the transaction limit issue
-- Check why user can create 35th transaction when they should be blocked

-- Check the user's transaction count and types
SELECT 
    'Transaction Analysis' as check_type,
    user_id,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN 'purchase' = ANY(tags) THEN 1 END) as purchase_transactions,
    COUNT(CASE WHEN NOT ('purchase' = ANY(tags)) THEN 1 END) as regular_transactions,
    DATE_TRUNC('month', CURRENT_DATE)::DATE as current_month_start
FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5'
  AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)::DATE
GROUP BY user_id;

-- Test the check function directly
SELECT 
    'Check Function Test' as check_type,
    check_monthly_transaction_limit('0d497c5c-3242-425e-aa73-1081385f46e5') as can_create_transaction;

-- Check the plan features
SELECT 
    'Plan Features' as check_type,
    get_user_plan_features('0d497c5c-3242-425e-aa73-1081385f46e5') as plan_features;
