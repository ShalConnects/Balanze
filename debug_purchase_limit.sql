-- Debug purchase limit enforcement
-- Check if the trigger function is working correctly

-- Test the purchase limit function
SELECT 
    'Testing purchase limit function' as test,
    check_purchase_limit('your-user-id-here') as can_create_purchase;

-- Check current purchase count
SELECT 
    'Current purchase count' as test,
    COUNT(*) as current_count
FROM purchases 
WHERE user_id = 'your-user-id-here';

-- Check the plan features
SELECT 
    'Plan features' as test,
    get_user_plan_features('your-user-id-here') as plan_features;

-- Test the enforcement function directly
SELECT 
    'Enforcement function test' as test,
    enforce_purchase_limit() as function_exists;
