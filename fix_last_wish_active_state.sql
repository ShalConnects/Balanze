-- Fix Last Wish is_active state issue
-- This script adds proper delivery tracking and fixes the logic

-- Add delivery_triggered field to track actual deliveries
ALTER TABLE last_wish_settings 
ADD COLUMN IF NOT EXISTS delivery_triggered BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN last_wish_settings.delivery_triggered IS 'Tracks if Last Wish delivery has been triggered to prevent duplicates';

-- Create index for faster lookups on delivery status
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_delivery_triggered 
ON last_wish_settings(delivery_triggered) WHERE delivery_triggered = TRUE;

-- Update the trigger_last_wish_delivery function to use delivery_triggered instead of is_active
CREATE OR REPLACE FUNCTION trigger_last_wish_delivery(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    settings_record RECORD;
    recipient_record RECORD;
    delivery_data JSONB;
BEGIN
    -- Get user settings
    SELECT * INTO settings_record 
    FROM last_wish_settings 
    WHERE user_id = user_uuid AND is_enabled = TRUE AND delivery_triggered = FALSE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Prepare delivery data based on settings
    delivery_data := jsonb_build_object(
        'message', settings_record.message,
        'delivery_date', NOW(),
        'data_included', settings_record.include_data
    );
    
    -- Create delivery records for each recipient
    FOR recipient_record IN 
        SELECT jsonb_array_elements(settings_record.recipients) as recipient
    LOOP
        INSERT INTO last_wish_deliveries (
            user_id, 
            recipient_email, 
            delivery_data, 
            delivery_status
        ) VALUES (
            user_uuid,
            recipient_record.recipient->>'email',
            delivery_data,
            'pending'
        );
    END LOOP;
    
    -- Mark as delivery triggered to prevent duplicate processing
    -- Keep is_active = TRUE so system remains active for user
    UPDATE last_wish_settings 
    SET delivery_triggered = TRUE,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the check_overdue_last_wish function to only check non-delivered users
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
    AND lws.delivery_triggered = FALSE  -- Only check users who haven't had delivery triggered
    AND lws.last_check_in IS NOT NULL
    AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;

-- Test the updated function
SELECT 'Last Wish active state fix applied successfully' as status;
