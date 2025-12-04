-- =====================================================
-- TEST TRANSACTION LIMIT ENFORCEMENT
-- This script tests if the 100 transaction limit works for free users
-- =====================================================

-- Step 1: Check if transaction limit trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'enforce_transaction_limit_trigger';

-- Step 2: Check transaction limit function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'check_transaction_limit';

-- Step 3: Verify subscription plan features
SELECT 
    name,
    features->>'max_transactions' as max_transactions,
    features->>'max_accounts' as max_accounts,
    features->>'max_currencies' as max_currencies
FROM subscription_plans 
WHERE name IN ('free', 'premium')
ORDER BY name;

-- Step 4: Test the transaction limit function directly
-- (Replace 'your-user-id-here' with an actual user ID to test)
/*
SELECT check_transaction_limit('your-user-id-here'::UUID) as can_create_transaction;
*/

-- Step 5: Get current transaction count for a user
-- (Replace 'your-user-id-here' with an actual user ID to test)
/*
SELECT 
    COUNT(*) as current_transactions,
    (SELECT features->>'max_transactions' FROM subscription_plans WHERE name = 'free')::INTEGER as limit
FROM transactions 
WHERE user_id = 'your-user-id-here'::UUID;
*/

-- Step 6: Check if trigger function exists and is properly formatted
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'enforce_transaction_limit'
AND n.nspname = 'public';
