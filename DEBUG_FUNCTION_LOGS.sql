-- DEBUG FUNCTION LOGS - Run this in Supabase SQL Editor

-- First, let's check what's happening in the function
-- We'll create a test version that shows us exactly what's failing

CREATE OR REPLACE FUNCTION debug_delete_user(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    auth_user_exists BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    result := result || 'Starting debug for user: ' || user_id || E'\n';
    
    -- Check if auth user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = debug_delete_user.user_id) INTO auth_user_exists;
    result := result || 'Auth user exists: ' || auth_user_exists || E'\n';
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = debug_delete_user.user_id) INTO profile_exists;
    result := result || 'Profile exists: ' || profile_exists || E'\n';
    
    -- Try to delete profile
    IF profile_exists THEN
        BEGIN
            DELETE FROM profiles WHERE id = debug_delete_user.user_id;
            result := result || 'Profile deleted successfully' || E'\n';
        EXCEPTION WHEN OTHERS THEN
            result := result || 'Profile deletion failed: ' || SQLERRM || E'\n';
        END;
    ELSE
        result := result || 'No profile to delete' || E'\n';
    END IF;
    
    -- Try to delete auth user
    IF auth_user_exists THEN
        BEGIN
            DELETE FROM auth.users WHERE id = debug_delete_user.user_id;
            result := result || 'Auth user deleted successfully' || E'\n';
        EXCEPTION WHEN OTHERS THEN
            result := result || 'Auth user deletion failed: ' || SQLERRM || E'\n';
        END;
    ELSE
        result := result || 'No auth user to delete' || E'\n';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION debug_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_delete_user(UUID) TO anon;

-- Test the debug function
SELECT debug_delete_user('cb3ac634-432d-4602-b2f9-3249702020d9'::UUID) as debug_result; 