-- Final fix for the check_overdue_last_wish function
-- This addresses the "structure of query does not match function result type" error
-- Run this in Supabase Dashboard > SQL Editor

-- Drop the existing function completely
DROP FUNCTION IF EXISTS check_overdue_last_wish();

-- Create the function with correct return types
CREATE OR REPLACE FUNCTION check_overdue_last_wish()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lws.user_id,
        COALESCE(au.email, 'unknown@example.com')::TEXT as email,
        CASE 
            WHEN lws.last_check_in IS NOT NULL THEN
                GREATEST(0, DATE_PART('day', NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER
            ELSE 0
        END as days_overdue
    FROM last_wish_settings lws
    LEFT JOIN auth.users au ON lws.user_id = au.id
    WHERE 
        lws.is_enabled = true 
        AND lws.is_active = true
        AND COALESCE(lws.delivery_triggered, false) = false
        AND lws.last_check_in IS NOT NULL
        AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;

-- Test the function
SELECT 'Testing check_overdue_last_wish function...' as status;

-- Try to call the function to verify it works
SELECT COUNT(*) as overdue_users_count FROM check_overdue_last_wish();

SELECT 'Function check_overdue_last_wish fixed successfully!' as status;
