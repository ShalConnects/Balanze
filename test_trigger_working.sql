-- =====================================================
-- TEST TRIGGER FUNCTIONALITY
-- =====================================================

-- Check if the trigger exists and is working
SELECT '=== TRIGGER STATUS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check the function definition
SELECT '=== FUNCTION DEFINITION ===' as info;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Test the function manually (this won't actually create a user, just test the logic)
SELECT '=== FUNCTION TEST ===' as info;
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_meta_data JSONB := '{"full_name": "Test User"}'::jsonb;
    result_count INTEGER;
BEGIN
    -- Simulate what the trigger would do
    INSERT INTO public.profiles (
        id, 
        full_name, 
        local_currency,
        role,
        subscription,
        created_at,
        updated_at
    )
    VALUES (
        test_user_id,
        COALESCE(test_meta_data->>'full_name', 'User'),
        'USD',
        'user',
        '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
        NOW(),
        NOW()
    );
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Test profile created successfully. Rows affected: %', result_count;
    
    -- Clean up the test data
    DELETE FROM public.profiles WHERE id = test_user_id;
    RAISE NOTICE 'Test data cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in test: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Check if there are any existing profiles
SELECT '=== EXISTING PROFILES ===' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Show a sample profile if any exist
SELECT '=== SAMPLE PROFILE ===' as info;
SELECT 
    id,
    full_name,
    local_currency,
    role,
    subscription,
    created_at
FROM public.profiles 
LIMIT 1; 