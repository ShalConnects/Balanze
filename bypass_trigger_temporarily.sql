-- =====================================================
-- TEMPORARY BYPASS: Disable trigger and handle manually
-- =====================================================

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simple function that does nothing (temporary)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Do nothing for now - we'll handle profile creation in the app
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (but it won't do anything)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '=== TRIGGER DISABLED ===' as info;
SELECT 'Profile creation will now be handled manually in the app' as message; 