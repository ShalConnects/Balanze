-- Test the purchase limit function with your user
-- Replace 'your-user-id-here' with the actual user ID
SELECT 
    'Current purchase count' as test_type,
    COUNT(*) as current_count
FROM purchases 
WHERE user_id = 'your-user-id-here';

-- Test the check function
SELECT 
    'Purchase limit check' as test_type,
    check_purchase_limit('your-user-id-here') as can_create_purchase;

-- Test the plan features
SELECT 
    'Plan features' as test_type,
    get_user_plan_features('your-user-id-here') as plan_features;

-- Test the user-specific limit function
SELECT 
    'User limit' as test_type,
    get_user_purchase_limit('your-user-id-here') as user_limit;
