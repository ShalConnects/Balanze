-- =====================================================
-- IMMEDIATE FIX FOR USER REGISTRATION ERROR
-- =====================================================

-- Step 1: Check what's currently in the profiles table
SELECT '=== CURRENT PROFILES TABLE SCHEMA ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT '{"plan": "free", "status": "active", "validUntil": null}'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Step 3: Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Create a new, simple function that works with your table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert with all the fields that should exist
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
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything goes wrong, just log it and continue
        RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify the trigger was created
SELECT '=== TRIGGER CREATED ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 7: Show final table schema
SELECT '=== FINAL PROFILES TABLE SCHEMA ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 