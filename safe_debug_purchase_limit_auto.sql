-- SAFE DEBUG: Check purchase limit status (READ-ONLY)
-- This will NOT modify any data or affect the system

-- Get the user ID from the current session (if available)
-- Or you can manually replace the UUID below with the actual user ID

-- Check current purchase count for all users (to see the pattern)
SELECT 
    'Purchase counts by user' as check_type,
    user_id,
    COUNT(*) as current_count
FROM purchases 
GROUP BY user_id
ORDER BY current_count DESC
LIMIT 10;

-- Check what the plan features are set to
SELECT 
    'Plan features' as check_type,
    name,
    features->>'max_purchases' as max_purchases_limit
FROM subscription_plans 
WHERE name = 'free';

-- Check if the trigger exists (safe)
SELECT 
    'Trigger status' as check_type,
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'enforce_purchase_limit_trigger';

-- Check recent purchases to see the pattern
SELECT 
    'Recent purchases' as check_type,
    user_id,
    item_name,
    created_at
FROM purchases 
ORDER BY created_at DESC
LIMIT 5;
