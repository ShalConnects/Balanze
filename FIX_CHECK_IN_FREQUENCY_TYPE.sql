-- Fix check_in_frequency column to support decimal values (for 5-minute testing)
-- Run this in Supabase SQL Editor

-- Step 1: Change the column type from INTEGER to NUMERIC to support decimal values
ALTER TABLE last_wish_settings 
ALTER COLUMN check_in_frequency TYPE NUMERIC(10,6);

-- Step 2: Update the check_overdue_last_wish function to use NUMERIC
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
            WHEN lws.check_in_frequency < 1 THEN
                -- For frequencies less than 1 day (like 5 minutes = 0.003472 days)
                EXTRACT(epoch FROM (NOW() - (lws.last_check_in + INTERVAL '1 second' * (lws.check_in_frequency * 24 * 60 * 60))))::INTEGER / 60 -- minutes overdue
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
            -- For frequencies less than 1 day (5 minutes)
            (lws.check_in_frequency < 1 AND (lws.last_check_in + INTERVAL '1 second' * (lws.check_in_frequency * 24 * 60 * 60)) < NOW())
            OR
            -- For normal day frequencies
            (lws.check_in_frequency >= 1 AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW())
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;

-- Step 4: Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'last_wish_settings' 
AND column_name = 'check_in_frequency';

-- Success message
SELECT 'check_in_frequency column updated to support decimal values!' as status;
