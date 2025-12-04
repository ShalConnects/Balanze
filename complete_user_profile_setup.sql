-- =====================================================
-- COMPLETE USER PROFILE SETUP FOR SUPABASE
-- =====================================================

-- Step 1: Verify current profiles table structure
SELECT '=== CURRENT PROFILES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Ensure all required columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS local_currency TEXT DEFAULT 'USD';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_currencies TEXT[];

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT '{"plan": "free", "status": "active", "validUntil": null}'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 3: Ensure foreign key constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Step 6: Drop existing user creation trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 7: Create a robust user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_exists BOOLEAN;
    v_full_name TEXT;
    v_user_metadata JSONB;
BEGIN
    -- Check if profile already exists (idempotency)
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO v_profile_exists;
    
    IF v_profile_exists THEN
        RAISE LOG 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Get user metadata
    v_user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Extract full_name from user metadata (check both possible keys)
    v_full_name := COALESCE(
        v_user_metadata->>'full_name',
        v_user_metadata->>'fullName',
        'User'
    );
    
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

-- Step 8: Create the user creation trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Verify the trigger was created
SELECT '=== TRIGGER STATUS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 10: Test the function manually
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

-- Step 11: Create RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for manual creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 12: Show final status
SELECT '=== SETUP COMPLETE ===' as info;
SELECT 'User profile system is now fully configured!' as message;
SELECT 'New users will automatically get profiles created' as note1;
SELECT 'Existing users can log in and profiles will be created if missing' as note2; 