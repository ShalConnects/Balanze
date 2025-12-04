-- =====================================================
-- TEMPORARILY DISABLE PROBLEMATIC TRIGGER
-- =====================================================

-- Step 1: Drop the problematic trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Verify the trigger is gone
SELECT '=== TRIGGER STATUS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 3: Test that profiles table is accessible
SELECT '=== PROFILES TABLE TEST ===' as info;
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    result_count INTEGER;
BEGIN
    -- Test inserting a profile manually
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
        test_id,
        'Test User',
        'USD',
        'user',
        '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
        NOW(),
        NOW()
    );
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Manual profile insert test successful. Rows affected: %', result_count;
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_id;
    RAISE NOTICE 'Test cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Manual profile insert test failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Step 4: Show final status
SELECT '=== TRIGGER DISABLED ===' as info;
SELECT 'User registration should now work without database errors' as message;
SELECT 'Profile creation will be handled manually in the application code' as message2; 