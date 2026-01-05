-- =====================================================
-- ADD AUDIT TRIGGERS FOR CLIENTS, TASKS, AND INVOICES
-- This will track all CREATE, UPDATE, DELETE operations
-- Uses audit_logs table (more comprehensive than activity_history)
-- =====================================================

-- Step 1: Ensure helper functions exist (from create_comprehensive_audit_triggers.sql)
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

-- Step 2: Update the generic audit function to handle clients, tasks, and invoices
-- This extends the existing log_audit_action function to work with all tables
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
    -- If auth.uid() is not available, try to get user_id from the row
    IF user_id IS NULL THEN
        IF TG_OP = 'INSERT' THEN
            user_id := NEW.user_id;
        ELSIF TG_OP = 'UPDATE' THEN
            user_id := NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            user_id := OLD.user_id;
        END IF;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        entity_id := NEW.id::TEXT;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        changes := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW));
        entity_id := NEW.id::TEXT;
        
        -- Only log if there are actual changes
        IF jsonb_array_length(changes) = 0 THEN
            RETURN NULL;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        entity_id := OLD.id::TEXT;
    END IF;
    
    entity_type := TG_TABLE_NAME;
    
    -- Insert into audit_logs table (primary, comprehensive audit trail)
    INSERT INTO audit_logs (
        user_id, 
        action_type, 
        entity_type, 
        entity_id, 
        old_values, 
        new_values,
        severity,
        created_at
    ) VALUES (
        user_id, 
        action_type, 
        entity_type, 
        CASE 
            WHEN entity_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN entity_id::UUID 
            ELSE NULL 
        END,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN 'high'
            WHEN TG_OP = 'UPDATE' AND entity_type IN ('client_tasks', 'invoices') THEN 'medium'
            ELSE 'low'
        END,
        NOW()
    );
    
    -- Also insert into activity_history for backward compatibility with History page
    -- Wrap in exception handling so it doesn't break the main operation if schema doesn't match
    BEGIN
        INSERT INTO activity_history (
            user_id,
            action_type,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            user_id,
            action_type,
            entity_type,
            entity_id,
            jsonb_build_object(
                'old_values', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
                'new_values', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
                'changes', CASE WHEN TG_OP = 'UPDATE' THEN changes ELSE '[]'::JSONB END
            ),
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- If activity_history insert fails (wrong schema, missing columns, etc.), 
        -- log the error but don't fail the main operation
        -- The audit_logs insert above will still succeed
        RAISE WARNING 'Failed to insert into activity_history: %', SQLERRM;
    END;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create audit trigger for clients table
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW 
    EXECUTE FUNCTION log_audit_action();

-- Step 3: Create audit trigger for client_tasks table
DROP TRIGGER IF EXISTS audit_client_tasks ON client_tasks;
CREATE TRIGGER audit_client_tasks
    AFTER INSERT OR UPDATE OR DELETE ON client_tasks
    FOR EACH ROW 
    EXECUTE FUNCTION log_audit_action();

-- Step 4: Create audit trigger for invoices table
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW 
    EXECUTE FUNCTION log_audit_action();

-- Step 5: Verification
SELECT 'AUDIT_TRIGGERS_ADDED' as status, 
       'Audit triggers created for clients, client_tasks, and invoices tables' as description;

