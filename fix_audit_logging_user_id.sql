-- Fix audit logging function to handle null user_id values
-- This addresses the "null value in column user_id" error

-- Drop the existing audit trigger first
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;

-- Drop existing functions to avoid parameter conflicts
DROP FUNCTION IF EXISTS log_audit_event(text,text,uuid,jsonb,jsonb,jsonb,text);
DROP FUNCTION IF EXISTS log_audit_event(text,text,uuid,uuid,jsonb,jsonb,jsonb,text);
DROP FUNCTION IF EXISTS audit_transaction_changes();

-- Update the log_audit_event function to handle null user_id
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_ip_address INET;
    v_user_agent TEXT;
    v_user_id UUID;
BEGIN
    -- Get client information
    v_ip_address := inet_client_addr();
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    
    -- Try to get user_id from auth context, but don't fail if it's null
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION
        WHEN OTHERS THEN
            v_user_id := NULL;
    END;
    
    -- Insert audit log (user_id can be null for system operations)
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
        severity
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
        NULL,
        p_severity
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the audit_transaction_changes function to handle null user_id
CREATE OR REPLACE FUNCTION audit_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'create',
            'transaction',
            NEW.id,
            NULL,
            to_jsonb(NEW),
            jsonb_build_object('amount', NEW.amount, 'type', NEW.type, 'category', NEW.category),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'update',
            'transaction',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object('amount', NEW.amount, 'type', NEW.type, 'changes_detected', true),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'delete',
            'transaction',
            OLD.id,
            to_jsonb(OLD),
            NULL,
            jsonb_build_object('amount', OLD.amount, 'type', OLD.type, 'category', OLD.category),
            'high'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION audit_transaction_changes();

-- Also update the audit_logs table to allow null user_id
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment to explain why user_id can be null
COMMENT ON COLUMN audit_logs.user_id IS 'User ID for the action. Can be null for system operations or when auth context is not available.'; 