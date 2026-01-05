-- =====================================================
-- FIX: Task Status Update Issue
-- This updates the log_audit_action function to handle
-- activity_history insert failures gracefully
-- =====================================================

-- Update the log_audit_action function with exception handling
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
    
    -- Map table names to entity types that History page expects
    entity_type := CASE TG_TABLE_NAME
        WHEN 'client_tasks' THEN 'task'  -- History page looks for 'task' or 'client_task'
        WHEN 'clients' THEN 'client'
        WHEN 'invoices' THEN 'invoice'
        ELSE TG_TABLE_NAME
    END;
    
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
            WHEN TG_OP = 'UPDATE' AND TG_TABLE_NAME IN ('client_tasks', 'invoices') THEN 'medium'
            ELSE 'low'
        END,
        NOW()
    );
    
    -- Also insert into activity_history for backward compatibility with History page
    -- History page expects: activity_type (not action_type) and details with new_values/old_values
    -- Wrap in exception handling so it doesn't break the main operation if schema doesn't match
    BEGIN
        -- First try: activity_type with details (what History page expects)
        INSERT INTO activity_history (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            user_id,  -- user_id is UUID in activity_history table
            action_type,    -- Map action_type to activity_type for History page
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
        -- If that fails, try with action_type (matching create_comprehensive_audit_triggers.sql)
        BEGIN
            INSERT INTO activity_history (
                user_id,
                action_type,
                entity_type,
                entity_id,
                details,
                created_at
            ) VALUES (
                user_id,  -- user_id is UUID in activity_history table
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
            -- If all fail, just log a warning - don't break the main operation
            RAISE WARNING 'Failed to insert into activity_history (tried activity_type and action_type): %', SQLERRM;
        END;
    END;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Verification
SELECT 'TRIGGER_FUNCTION_UPDATED' as status, 
       'log_audit_action function updated with exception handling' as description;

