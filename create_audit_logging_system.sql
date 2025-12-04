-- =====================================================
-- COMPREHENSIVE AUDIT LOGGING SYSTEM
-- =====================================================

-- Create audit_logs table to track all user actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', 'transfer', etc.
    entity_type TEXT NOT NULL, -- 'account', 'transaction', 'transfer', 'profile', 'savings_goal', etc.
    entity_id UUID, -- ID of the affected entity (nullable for login/logout)
    old_values JSONB, -- Previous state (for updates)
    new_values JSONB, -- New state
    metadata JSONB, -- Additional context (IP, user agent, session info, etc.)
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

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true); -- Allow system to insert logs

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

-- 1. Account changes trigger
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

-- 2. Transaction changes trigger
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

-- 3. Transfer logging function (for manual calls)
CREATE OR REPLACE FUNCTION log_transfer_event(
    p_from_account_id UUID,
    p_to_account_id UUID,
    p_amount DECIMAL,
    p_exchange_rate DECIMAL,
    p_transfer_type TEXT DEFAULT 'currency'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_metadata JSONB;
BEGIN
    v_metadata := jsonb_build_object(
        'from_account_id', p_from_account_id,
        'to_account_id', p_to_account_id,
        'amount', p_amount,
        'exchange_rate', p_exchange_rate,
        'transfer_type', p_transfer_type
    );
    
    v_log_id := log_audit_event(
        'transfer',
        'transfer',
        NULL,
        NULL,
        v_metadata,
        v_metadata,
        'medium'
    );
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Profile changes trigger
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'create',
            'profile',
            NEW.id,
            NULL,
            to_jsonb(NEW),
            jsonb_build_object('full_name', NEW.full_name),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'update',
            'profile',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object('full_name', NEW.full_name, 'changes_detected', true),
            'low'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_profile_changes();

-- 5. Savings goal changes trigger
CREATE OR REPLACE FUNCTION audit_savings_goal_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'create',
            'savings_goal',
            NEW.id,
            NULL,
            to_jsonb(NEW),
            jsonb_build_object('goal_name', NEW.name, 'target_amount', NEW.target_amount),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'update',
            'savings_goal',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object('goal_name', NEW.name, 'changes_detected', true),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'delete',
            'savings_goal',
            OLD.id,
            to_jsonb(OLD),
            NULL,
            jsonb_build_object('goal_name', OLD.name, 'target_amount', OLD.target_amount),
            'high'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for savings_goals
DROP TRIGGER IF EXISTS audit_savings_goals_trigger ON savings_goals;
CREATE TRIGGER audit_savings_goals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION audit_savings_goal_changes();

-- Create views for easy audit log querying

-- 1. User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    user_id,
    action_type,
    entity_type,
    COUNT(*) as action_count,
    MIN(created_at) as first_action,
    MAX(created_at) as last_action,
    COUNT(DISTINCT DATE(created_at)) as active_days
FROM audit_logs
GROUP BY user_id, action_type, entity_type;

-- 2. Security events view (high severity events)
CREATE OR REPLACE VIEW security_events AS
SELECT 
    id,
    user_id,
    action_type,
    entity_type,
    ip_address,
    user_agent,
    created_at,
    severity,
    metadata
FROM audit_logs
WHERE severity IN ('high', 'critical')
ORDER BY created_at DESC;

-- 3. Transfer history view
CREATE OR REPLACE VIEW transfer_history AS
SELECT 
    al.id,
    al.user_id,
    al.created_at,
    al.metadata->>'from_account_id' as from_account_id,
    al.metadata->>'to_account_id' as to_account_id,
    al.metadata->>'amount' as amount,
    al.metadata->>'exchange_rate' as exchange_rate,
    al.metadata->>'transfer_type' as transfer_type,
    al.ip_address,
    al.user_agent
FROM audit_logs al
WHERE al.action_type = 'transfer'
ORDER BY al.created_at DESC;

-- Create function to get user activity report
CREATE OR REPLACE FUNCTION get_user_activity_report(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    action_type TEXT,
    entity_type TEXT,
    action_count BIGINT,
    last_action TIMESTAMP WITH TIME ZONE,
    total_transactions BIGINT,
    total_transfers BIGINT,
    total_account_changes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.action_type,
        al.entity_type,
        COUNT(*) as action_count,
        MAX(al.created_at) as last_action,
        COUNT(CASE WHEN al.entity_type = 'transaction' THEN 1 END) as total_transactions,
        COUNT(CASE WHEN al.action_type = 'transfer' THEN 1 END) as total_transfers,
        COUNT(CASE WHEN al.entity_type = 'account' THEN 1 END) as total_account_changes
    FROM audit_logs al
    WHERE al.user_id = p_user_id
    AND al.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY al.action_type, al.entity_type
    ORDER BY action_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean old audit logs (for performance)
CREATE OR REPLACE FUNCTION clean_old_audit_logs(
    p_days_to_keep INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
    AND severity = 'low'; -- Only delete low severity logs, keep important ones
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT SELECT ON security_events TO authenticated;
GRANT SELECT ON transfer_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_report(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Create a scheduled job to clean old logs (if using pg_cron extension)
-- SELECT cron.schedule('clean-audit-logs', '0 2 * * 0', 'SELECT clean_old_audit_logs(365);');

-- Insert initial audit log entry
INSERT INTO audit_logs (user_id, action_type, entity_type, metadata, severity)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'system_init',
    'system',
    '{"message": "Audit logging system initialized"}',
    'low'
); 