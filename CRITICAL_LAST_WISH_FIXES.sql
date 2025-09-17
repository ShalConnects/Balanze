-- CRITICAL LAST WISH SYSTEM FIXES
-- Based on comprehensive testing results
-- Run these fixes in order

-- =============================================================================
-- FIX 1: ADD MISSING delivery_triggered COLUMN
-- =============================================================================

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'last_wish_settings' 
        AND column_name = 'delivery_triggered'
    ) THEN
        ALTER TABLE last_wish_settings 
        ADD COLUMN delivery_triggered BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Added delivery_triggered column to last_wish_settings table';
    ELSE
        RAISE NOTICE 'delivery_triggered column already exists';
    END IF;
END $$;

-- =============================================================================
-- FIX 2: UPDATE check_overdue_last_wish FUNCTION
-- =============================================================================

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
        AND lws.delivery_triggered = false  -- Only check users who haven't had delivery triggered
        AND lws.last_check_in IS NOT NULL
        AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO service_role;

-- =============================================================================
-- FIX 3: CREATE trigger_last_wish_delivery FUNCTION
-- =============================================================================

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
    
    -- Log the delivery trigger
    INSERT INTO last_wish_deliveries (
        user_id,
        recipient_email,
        delivery_status,
        triggered_at,
        delivery_data
    )
    SELECT 
        target_user_id,
        recipient->>'email',
        'triggered',
        NOW(),
        jsonb_build_object(
            'trigger_reason', 'overdue_check_in',
            'days_overdue', EXTRACT(days FROM (NOW() - (settings_record.last_check_in + INTERVAL '1 day' * settings_record.check_in_frequency)))::INTEGER,
            'settings', row_to_json(settings_record)
        )
    FROM jsonb_array_elements(settings_record.recipients) AS recipient;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO service_role;

-- =============================================================================
-- FIX 4: ENSURE last_wish_deliveries TABLE EXISTS
-- =============================================================================

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

-- Enable RLS
ALTER TABLE last_wish_deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own deliveries" ON last_wish_deliveries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all deliveries" ON last_wish_deliveries
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON last_wish_deliveries TO authenticated;
GRANT ALL ON last_wish_deliveries TO service_role;

-- =============================================================================
-- FIX 5: UPDATE EXISTING RECORDS
-- =============================================================================

-- Set delivery_triggered to false for all existing records that are active
UPDATE last_wish_settings 
SET delivery_triggered = false 
WHERE delivery_triggered IS NULL 
AND is_enabled = true;

-- =============================================================================
-- FIX 6: CREATE HELPER FUNCTION FOR TESTING
-- =============================================================================

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_last_wish_delivery_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_last_wish_delivery_status(UUID) TO service_role;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify the fixes
SELECT 'delivery_triggered column exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'last_wish_settings' 
           AND column_name = 'delivery_triggered'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'check_overdue_last_wish function exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'check_overdue_last_wish'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'trigger_last_wish_delivery function exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'trigger_last_wish_delivery'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'last_wish_deliveries table exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'last_wish_deliveries'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

-- Show current Last Wish settings
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

COMMIT;
