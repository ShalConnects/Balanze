-- =====================================================
-- DEFINITIVE FIX FOR USER REGISTRATION
-- =====================================================

-- Step 1: Completely remove the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Check if there are any other triggers on auth.users
SELECT '=== CHECKING FOR OTHER TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Step 3: Create a minimal function that does nothing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Do absolutely nothing - let Supabase handle user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a minimal trigger that does nothing
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the trigger is minimal
SELECT '=== MINIMAL TRIGGER CREATED ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Test that we can insert into profiles manually
SELECT '=== TESTING MANUAL PROFILE INSERT ===' as info;
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

-- Step 7: Show final status
SELECT '=== REGISTRATION SHOULD NOW WORK ===' as info;
SELECT 'The trigger now does nothing, so Supabase Auth will work normally' as message;
SELECT 'Profile creation will be handled manually in the app code' as message2; 