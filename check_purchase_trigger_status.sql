-- Check if purchase limit trigger is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'enforce_purchase_limit_trigger';

-- Check if the trigger function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'enforce_purchase_limit';

-- Test the purchase limit function
SELECT check_purchase_limit('your-user-id-here') as can_create_purchase;
