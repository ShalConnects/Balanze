-- Alternative approach: Create a function that returns JSON
-- This might work better with Supabase RPC calls

-- Drop the existing function
DROP FUNCTION IF EXISTS check_overdue_last_wish();

-- Create a function that returns JSON array
CREATE OR REPLACE FUNCTION check_overdue_last_wish()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'user_id', lws.user_id,
            'email', au.email,
            'days_overdue', EXTRACT(DAY FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER
        )
    ) INTO result
    FROM last_wish_settings lws
    JOIN auth.users au ON lws.user_id = au.id
    WHERE lws.is_enabled = TRUE 
    AND lws.is_active = TRUE
    AND lws.last_check_in IS NOT NULL
    AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency);
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;

-- Test the function
SELECT check_overdue_last_wish(); 