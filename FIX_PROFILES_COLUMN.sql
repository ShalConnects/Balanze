-- Fix the profiles table column reference
-- Run this in Supabase SQL Editor

-- First, let's check the profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Drop and recreate the function with correct column reference
DROP FUNCTION IF EXISTS check_overdue_last_wish();

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
        COALESCE(p.email, au.email, 'unknown@example.com')::TEXT as email,
        EXTRACT(days FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    LEFT JOIN profiles p ON lws.user_id = p.id  -- Changed from p.user_id to p.id
    LEFT JOIN auth.users au ON lws.user_id = au.id
    WHERE 
        lws.is_enabled = true 
        AND lws.is_active = true
        AND lws.delivery_triggered = false
        AND lws.last_check_in IS NOT NULL
        AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;

-- Test the function
SELECT * FROM check_overdue_last_wish() LIMIT 3;

-- Success message
SELECT 'check_overdue_last_wish function fixed with correct column reference!' as status;
