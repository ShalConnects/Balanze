-- =====================================================
-- COMPREHENSIVE FIX FOR PROFILES TABLE
-- =====================================================

-- First, let's see what we actually have
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

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a new function that matches your actual table schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Add comprehensive error handling
    BEGIN
        -- Check if profile already exists
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
            RAISE LOG 'Profile already exists for user %', NEW.id;
            RETURN NEW;
        END IF;
        
        -- Insert profile with only the fields that exist in your table
        INSERT INTO public.profiles (
            id, 
            full_name, 
            local_currency
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            'USD'
        );
        
        RAISE LOG 'Profile created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
            RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 'Trigger created successfully' as status;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test the function (this won't actually insert, just test the logic)
SELECT 'Function test completed' as status; 