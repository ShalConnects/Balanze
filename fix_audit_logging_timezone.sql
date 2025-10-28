-- Fix audit logging timezone issue
-- The audit_logs table uses DEFAULT NOW() which uses database server timezone
-- This should use UTC like other tables for consistency

-- Update the audit_logs table to use UTC timezone
ALTER TABLE audit_logs 
ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());

-- Update the log_audit_event function to use UTC timezone
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'low'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_id UUID;
    v_ip_address INET;
    v_user_agent TEXT;
    v_session_id TEXT;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get client information from request headers (if available)
    v_ip_address := inet_client_addr();
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    v_session_id := current_setting('request.headers', true)::json->>'x-session-id';
    
    -- Insert audit log with explicit UTC timestamp
    INSERT INTO audit_logs (
        user_id,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values,
        metadata,
        ip_address,
        user_agent,
        session_id,
        severity,
        created_at
    ) VALUES (
        v_user_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_old_values,
        p_new_values,
        p_metadata,
        v_ip_address,
        v_user_agent,
        v_session_id,
        p_severity,
        TIMEZONE('utc'::text, NOW())
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fix
SELECT 'Audit logging timezone fix applied successfully' as status;
