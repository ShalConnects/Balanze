-- Temporarily disable the trigger that's causing the 500 error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify the trigger is disabled
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'; 
 