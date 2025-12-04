-- Test the purchase limit trigger function
-- This will test if the trigger is working correctly

-- Test the check function directly
SELECT 
    'Testing check function' as test,
    check_purchase_limit('0d497c5c-3242-425e-aa73-1081385f46e5') as can_create_purchase;

-- Test the plan features
SELECT 
    'Plan features' as test,
    get_user_plan_features('0d497c5c-3242-425e-aa73-1081385f46e5') as plan_features;

-- Test the enforcement function (this should return the function definition)
SELECT 
    'Enforcement function' as test,
    proname as function_name
FROM pg_proc 
WHERE proname = 'enforce_purchase_limit';
