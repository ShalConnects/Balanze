-- Simple fix for Last Wish active state issue
-- This prevents background processes from deactivating the system

-- Option 1: Temporarily disable the background process functions
-- Comment out these lines if you want to re-enable them later

-- DROP FUNCTION IF EXISTS check_overdue_last_wish();
-- DROP FUNCTION IF EXISTS trigger_last_wish_delivery(UUID);

-- Option 2: Modify the check_overdue_last_wish function to be less aggressive
-- This version will only check users who have been inactive for a very long time

CREATE OR REPLACE FUNCTION check_overdue_last_wish()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lws.user_id,
        au.email,
        EXTRACT(DAY FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    JOIN auth.users au ON lws.user_id = au.id
    WHERE lws.is_enabled = TRUE 
    AND lws.is_active = TRUE
    AND lws.last_check_in IS NOT NULL
    -- Only check users who are significantly overdue (more than 2x their check-in frequency)
    AND NOW() > (lws.last_check_in + INTERVAL '1 day' * (lws.check_in_frequency * 2));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;

-- Test the function
SELECT 'Last Wish background process made less aggressive' as status;
