-- =====================================================
-- DIAGNOSE CLIENT LIMIT ISSUE
-- Check why the trigger isn't working
-- =====================================================

-- Step 1: Check if trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'enforce_client_limit_trigger';

-- Step 2: Check if function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'enforce_client_limit';

-- Step 3: Check subscription_plans for max_clients
SELECT 
    name,
    features->>'max_clients' as max_clients,
    features
FROM subscription_plans
ORDER BY name;

-- Step 4: Check a sample user's plan features (replace with actual user_id)
-- This will show what get_user_plan_features returns
-- SELECT get_user_plan_features('YOUR_USER_ID_HERE'::uuid);

-- Step 5: Check current client count for a user (replace with actual user_id)
-- SELECT 
--     user_id,
--     COUNT(*) as client_count
-- FROM clients
-- WHERE user_id = 'YOUR_USER_ID_HERE'::uuid
-- GROUP BY user_id;
