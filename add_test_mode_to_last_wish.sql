-- Add test mode field to last_wish_settings table
-- This allows users to test the Last Wish functionality with shorter time intervals

-- Add the is_test_mode column
ALTER TABLE last_wish_settings 
ADD COLUMN IF NOT EXISTS is_test_mode BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN last_wish_settings.is_test_mode IS 'When true, check_in_frequency is interpreted as hours instead of days for testing purposes';

-- Create index for faster lookups on test mode
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_test_mode ON last_wish_settings(is_test_mode) WHERE is_test_mode = TRUE;

-- Update the check_overdue_last_wish function to handle test mode
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
        CASE 
            WHEN lws.is_test_mode THEN 
                EXTRACT(HOUR FROM (NOW() - (lws.last_check_in + INTERVAL '1 hour' * lws.check_in_frequency)))::INTEGER
            ELSE 
                EXTRACT(DAY FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER
        END as days_overdue
    FROM last_wish_settings lws
    JOIN auth.users au ON lws.user_id = au.id
    WHERE lws.is_enabled = TRUE 
    AND lws.is_active = TRUE
    AND lws.last_check_in IS NOT NULL
    AND (
        (lws.is_test_mode = TRUE AND NOW() > (lws.last_check_in + INTERVAL '1 hour' * lws.check_in_frequency))
        OR 
        (lws.is_test_mode = FALSE AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'Test mode column added successfully' as status;
