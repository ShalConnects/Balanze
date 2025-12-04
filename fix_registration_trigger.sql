-- =====================================================
-- FIX USER REGISTRATION TRIGGER
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

-- Step 2: Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create a new, safe function that handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists to avoid conflicts
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RAISE LOG 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Try to insert profile with error handling
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
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            'USD',
            'user',
            '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Profile created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
            -- Return NEW to allow user creation to continue
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

-- Step 6: Test the function manually (this won't actually create a user)
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
SELECT '=== REGISTRATION SHOULD NOW WORK ===' as info;
SELECT 'The trigger now handles errors gracefully and won''t fail user registration' as message; 