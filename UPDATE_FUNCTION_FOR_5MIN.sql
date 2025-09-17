-- Update function to handle -5 as 5-minute frequency
-- Run this in Supabase SQL Editor

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
            WHEN lws.check_in_frequency = -5 THEN
                -- For 5-minute testing frequency (-5 = 5 minutes)
                EXTRACT(epoch FROM (NOW() - (lws.last_check_in + INTERVAL '5 minutes')))::INTEGER / 60 -- minutes overdue
            ELSE
                -- For normal day frequencies
                EXTRACT(days FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER
        END as days_overdue
    FROM last_wish_settings lws
    LEFT JOIN auth.users au ON lws.user_id = au.id
    WHERE 
        lws.is_enabled = true 
        AND lws.is_active = true
        AND lws.delivery_triggered = false
        AND lws.last_check_in IS NOT NULL
        AND (
            -- For 5-minute frequency
            (lws.check_in_frequency = -5 AND (lws.last_check_in + INTERVAL '5 minutes') < NOW())
            OR
            -- For normal day frequencies
            (lws.check_in_frequency > 0 AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW())
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;

-- Success message
SELECT 'Function updated to support 5-minute frequency (-5)!' as status;
