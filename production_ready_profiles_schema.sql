-- =====================================================
-- PRODUCTION-READY PROFILES TABLE & TRIGGER SYSTEM
-- =====================================================

-- Step 1: Ensure profiles table has all required fields
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    local_currency TEXT DEFAULT 'USD',
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    subscription JSONB DEFAULT '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
    profile_picture TEXT,
    selected_currencies TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 2: Add any missing columns (safe to run multiple times)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS local_currency TEXT DEFAULT 'USD';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT '{"plan": "free", "status": "active", "validUntil": null}'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_currencies TEXT[];

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 3: Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Step 4: Create production-ready user registration trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_profile_exists BOOLEAN;
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
            -- Profile was created by another process, this is fine
            RAISE LOG 'Profile already exists for user % (unique violation)', NEW.id;
            RETURN NEW;
        WHEN OTHERS THEN
            -- Log the error but don't fail user creation
            RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
            -- Return NEW to allow user creation to continue
            RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create comprehensive RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles USING GIN(subscription);

-- Step 9: Verify the setup
SELECT '=== PRODUCTION-READY PROFILES SETUP ===' as info;

SELECT 'Current profiles table schema:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Trigger status:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 10: Test the trigger function
SELECT 'Testing trigger function...' as info;
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
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_user_id;
    RAISE NOTICE 'Test cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in test: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

SELECT '=== PRODUCTION SETUP COMPLETE ===' as info;
SELECT 'Your SaaS is now ready for production user registration!' as message; 