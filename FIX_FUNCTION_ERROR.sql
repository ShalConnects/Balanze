-- Fix for the function return type error
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing function first
DROP FUNCTION IF EXISTS trigger_last_wish_delivery(uuid);

-- Step 2: Now create the function with the correct return type
CREATE OR REPLACE FUNCTION trigger_last_wish_delivery(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    settings_record RECORD;
BEGIN
    -- Get the user's settings
    SELECT * INTO settings_record
    FROM last_wish_settings
    WHERE user_id = target_user_id
    AND is_enabled = true
    AND is_active = true
    AND delivery_triggered = false;
    
    -- If no valid settings found, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Mark delivery as triggered
    UPDATE last_wish_settings
    SET 
        delivery_triggered = true,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO service_role;

-- Step 4: Test the function
SELECT 'Function trigger_last_wish_delivery recreated successfully!' as status;
