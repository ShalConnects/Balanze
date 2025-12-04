-- SAFE DEBUG: Check purchase limit status (READ-ONLY)
-- This will NOT modify any data or affect the system

-- Check current purchase count for the user
SELECT 
    'Current purchase count' as check_type,
    COUNT(*) as current_count
FROM purchases 
WHERE user_id = 'your-user-id-here';

-- Check what the plan features are set to
SELECT 
    'Plan features' as check_type,
    features->>'max_purchases' as max_purchases_limit
FROM subscription_plans 
WHERE name = 'free';

-- Check if the trigger exists (safe)
SELECT 
    'Trigger status' as check_type,
    trigger_name,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'enforce_purchase_limit_trigger';
