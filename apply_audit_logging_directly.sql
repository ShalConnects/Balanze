-- =====================================================
-- APPLY AUDIT LOGGING SYSTEM DIRECTLY
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create audit_logs table to track all user actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action_type, created_at);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- Create function to log audit events
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
    
    -- Insert audit log
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
        v_session_id,
        p_severity
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
    p_action_type TEXT,
    p_user_id UUID,
    p_metadata JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_ip_address INET;
    v_user_agent TEXT;
BEGIN
    -- Get client information
    v_ip_address := inet_client_addr();
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    
    -- Insert audit log
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
        p_user_id,
        p_action_type,
        'auth',
        NULL,
        NULL,
        NULL,
        p_metadata,
        v_ip_address,
        v_user_agent,
        NULL,
        p_severity
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic audit logging

-- 1. Transaction changes trigger
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

-- Create trigger for transactions
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION audit_transaction_changes();

-- 2. Account changes trigger
CREATE OR REPLACE FUNCTION audit_account_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'create',
            'account',
            NEW.id,
            NULL,
            to_jsonb(NEW),
            jsonb_build_object('account_name', NEW.name, 'account_type', NEW.type),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'update',
            'account',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object('account_name', NEW.name, 'changes_detected', true),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'delete',
            'account',
            OLD.id,
            to_jsonb(OLD),
            NULL,
            jsonb_build_object('account_name', OLD.name, 'account_type', OLD.type),
            'high'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for accounts
DROP TRIGGER IF EXISTS audit_accounts_trigger ON accounts;
CREATE TRIGGER audit_accounts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION audit_account_changes();

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_auth_event(TEXT, UUID, JSONB, TEXT) TO authenticated;

-- Insert initial audit log entry (only if no entries exist)
INSERT INTO audit_logs (user_id, action_type, entity_type, metadata, severity)
SELECT 
    (SELECT id FROM auth.users LIMIT 1),
    'system_init',
    'system',
    '{"message": "Audit logging system initialized"}',
    'low'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE action_type = 'system_init');

-- Test the audit logging system
SELECT 'Audit logging system setup complete!' as status; 