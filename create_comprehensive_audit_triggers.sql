-- Comprehensive audit triggers for all main tables
-- Logs CREATE, UPDATE, DELETE for transactions, purchases, accounts, transfers
-- Logs field-level changes in activity_history JSONB

-- Helper function to get changed fields for UPDATE
CREATE OR REPLACE FUNCTION jsonb_diff(old_row JSONB, new_row JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '[]'::JSONB;
    key TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    FOR key IN SELECT jsonb_object_keys(old_row)
    LOOP
        old_val := old_row ->> key;
        new_val := new_row ->> key;
        IF old_val IS DISTINCT FROM new_val THEN
            result := result || jsonb_build_object('field', key, 'old', old_val, 'new', new_val);
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper to get user_id (if using auth)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    BEGIN
        RETURN auth.uid();
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Generic audit function
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    changes JSONB;
    action_type TEXT;
    entity_type TEXT;
    entity_id TEXT;
    details JSONB;
    user_id UUID := get_current_user_id();
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        details := jsonb_build_object('new_values', to_jsonb(NEW));
        entity_id := COALESCE(NEW.transaction_id, NEW.id::TEXT);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        changes := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW));
        details := jsonb_build_object('changes', changes);
        entity_id := COALESCE(NEW.transaction_id, NEW.id::TEXT);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        details := jsonb_build_object('old_values', to_jsonb(OLD));
        entity_id := COALESCE(OLD.transaction_id, OLD.id::TEXT);
    END IF;
    entity_type := TG_TABLE_NAME;
    INSERT INTO activity_history (
        user_id, action_type, entity_type, entity_id, details, created_at
    ) VALUES (
        user_id, action_type, entity_type, entity_id, details, NOW()
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS audit_transactions ON transactions;
DROP TRIGGER IF EXISTS audit_purchases ON purchases;
DROP TRIGGER IF EXISTS audit_accounts ON accounts;
DROP TRIGGER IF EXISTS audit_transfers ON transfers;

-- Create triggers for all actions on all main tables
CREATE TRIGGER audit_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_audit_action();

CREATE TRIGGER audit_purchases
    AFTER INSERT OR UPDATE OR DELETE ON purchases
    FOR EACH ROW EXECUTE FUNCTION log_audit_action();

CREATE TRIGGER audit_accounts
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION log_audit_action();

CREATE TRIGGER audit_transfers
    AFTER INSERT OR UPDATE OR DELETE ON transfers
    FOR EACH ROW EXECUTE FUNCTION log_audit_action(); 