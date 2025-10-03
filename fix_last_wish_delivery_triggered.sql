-- Add the delivery_triggered column to last_wish_settings if it doesn't exist
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Add the delivery_triggered column if it doesn't exist
ALTER TABLE last_wish_settings 
ADD COLUMN IF NOT EXISTS delivery_triggered BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing records to have delivery_triggered = false where it's null
UPDATE last_wish_settings 
SET delivery_triggered = false 
WHERE delivery_triggered IS NULL;

-- Step 3: Add index for better performance on delivery_triggered queries
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_delivery_triggered 
ON last_wish_settings(delivery_triggered) 
WHERE delivery_triggered = FALSE;

-- Step 4: Update the check_overdue_last_wish function to use delivery_triggered
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
        COALESCE(au.email, 'unknown@example.com') as email,
        EXTRACT(days FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    LEFT JOIN auth.users au ON lws.user_id = au.id
    WHERE 
        lws.is_enabled = true 
        AND lws.is_active = true
        AND lws.delivery_triggered = false
        AND lws.last_check_in IS NOT NULL
        AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions to the function
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;

-- Step 6: Create function to reset delivery_triggered for testing
CREATE OR REPLACE FUNCTION reset_delivery_triggered(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE last_wish_settings
    SET delivery_triggered = false,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the reset function
GRANT EXECUTE ON FUNCTION reset_delivery_triggered(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_delivery_triggered(UUID) TO service_role;

SELECT 'Last Wish delivery_triggered column and functions updated successfully!' as status;
