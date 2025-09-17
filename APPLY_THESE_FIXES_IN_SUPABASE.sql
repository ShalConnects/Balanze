-- =====================================================================================
-- CRITICAL LAST WISH DATABASE FIXES
-- Run these commands in your Supabase Dashboard > SQL Editor
-- =====================================================================================

-- Step 1: Add missing delivery_triggered column
ALTER TABLE last_wish_settings 
ADD COLUMN IF NOT EXISTS delivery_triggered BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing records to have delivery_triggered = false
UPDATE last_wish_settings 
SET delivery_triggered = false 
WHERE delivery_triggered IS NULL;

-- Step 3: Update the check_overdue_last_wish function to use the new column
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
        COALESCE(p.email, au.email, 'unknown@example.com') as email,
        EXTRACT(days FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    LEFT JOIN profiles p ON lws.user_id = p.user_id
    LEFT JOIN auth.users au ON lws.user_id = au.id
    WHERE 
        lws.is_enabled = true 
        AND lws.is_active = true
        AND lws.delivery_triggered = false  -- This line was causing the error
        AND lws.last_check_in IS NOT NULL
        AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger_last_wish_delivery function
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

-- Step 5: Ensure last_wish_deliveries table exists
CREATE TABLE IF NOT EXISTS last_wish_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    delivery_status TEXT DEFAULT 'pending',
    delivery_data JSONB DEFAULT '{}',
    error_message TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS on deliveries table
ALTER TABLE last_wish_deliveries ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for deliveries table
CREATE POLICY "Users can view their own deliveries" ON last_wish_deliveries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all deliveries" ON last_wish_deliveries
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 8: Grant permissions
GRANT ALL ON last_wish_deliveries TO authenticated;
GRANT ALL ON last_wish_deliveries TO service_role;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO service_role;

-- Step 9: Create helper function for testing
CREATE OR REPLACE FUNCTION reset_last_wish_delivery_status(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Reset delivery_triggered to false for testing
    UPDATE last_wish_settings
    SET 
        delivery_triggered = false,
        is_active = true,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Delete previous delivery records for clean testing
    DELETE FROM last_wish_deliveries 
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_last_wish_delivery_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_last_wish_delivery_status(UUID) TO service_role;

-- =====================================================================================
-- VERIFICATION QUERIES - Run these to confirm fixes worked
-- =====================================================================================

-- Check if delivery_triggered column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'last_wish_settings' 
AND column_name = 'delivery_triggered';

-- Test the updated function
SELECT * FROM check_overdue_last_wish() LIMIT 5;

-- Check current Last Wish settings
SELECT 
    user_id,
    is_enabled,
    is_active,
    delivery_triggered,
    check_in_frequency,
    last_check_in,
    jsonb_array_length(recipients) as recipient_count,
    created_at
FROM last_wish_settings
ORDER BY created_at DESC
LIMIT 5;

-- Confirm functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('check_overdue_last_wish', 'trigger_last_wish_delivery', 'reset_last_wish_delivery_status')
AND routine_schema = 'public';

-- =====================================================================================
-- SUCCESS MESSAGE
-- =====================================================================================
SELECT 'All Last Wish database fixes have been applied successfully!' as status;
