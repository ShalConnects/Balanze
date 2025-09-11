-- Disable automatic cash account creation for new users
-- This ensures accounts are only created when users explicitly choose a currency

-- Drop the trigger that automatically creates cash accounts
DROP TRIGGER IF EXISTS on_auth_user_created_create_cash_account ON auth.users;

-- Drop the function as well since it's no longer needed
DROP FUNCTION IF EXISTS create_default_cash_account();

-- Verify the trigger has been removed
SELECT '=== AUTOMATIC CASH ACCOUNT CREATION DISABLED ===' as info;

-- Check that the trigger no longer exists
SELECT 'Checking trigger status:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_create_cash_account';

-- Show confirmation
SELECT 'New users will now only get accounts when they explicitly select a currency in the welcome modal.' as message; 