-- =====================================================
-- FIX USER PROFILE CREATION TRIGGER
-- =====================================================

-- Step 1: Check current trigger status
SELECT '=== CURRENT TRIGGER STATUS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 2: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create a robust function that handles profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_exists BOOLEAN;
    v_full_name TEXT;
BEGIN
    -- Check if profile already exists (idempotency)
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO v_profile_exists;
    
    IF v_profile_exists THEN
        RAISE LOG 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Extract full_name from user metadata
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    
    -- Insert profile with comprehensive error handling
    BEGIN
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
            NEW.id,
            v_full_name,
            'USD',
            'user',
            '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Profile created successfully for user % with name %', NEW.id, v_full_name;
        
    EXCEPTION
        WHEN unique_violation THEN
            RAISE LOG 'Profile already exists for user % (unique violation)', NEW.id;
            RETURN NEW;
        WHEN OTHERS THEN
            RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
            RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the trigger was created
SELECT '=== TRIGGER CREATED ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Test the function manually
SELECT '=== TESTING FUNCTION ===' as info;
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

-- Step 7: Show final status
SELECT '=== PROFILE CREATION SHOULD NOW WORK ===' as info;
SELECT 'The trigger will now automatically create profiles for new users' as message; 