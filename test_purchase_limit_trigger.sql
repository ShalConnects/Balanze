-- Test if the purchase limit trigger is working
-- This will test the trigger directly

-- Test the check function for the user
SELECT 
    'Testing purchase limit check' as test,
    check_purchase_limit('0d497c5c-3242-425e-aa73-1081385f46e5') as can_create_purchase;

-- Check the user's current purchase count
SELECT 
    'Current purchase count' as test,
    COUNT(*) as purchase_count
FROM purchases 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5';

-- Check the plan features
SELECT 
    'Plan features' as test,
    get_user_plan_features('0d497c5c-3242-425e-aa73-1081385f46e5') as plan_features;
