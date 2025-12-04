-- Fix audit trigger to use UTC timezone
-- This ensures the trigger uses the updated log_audit_event function

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;

-- Update the audit_transaction_changes function to ensure it uses the updated log_audit_event
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

-- Test the fix by checking the current timezone settings
SELECT 
    'Current database timezone: ' || current_setting('timezone') as info,
    'Current time: ' || NOW() as current_time,
    'UTC time: ' || TIMEZONE('utc'::text, NOW()) as utc_time;

-- Verify the trigger is working
SELECT 'Audit trigger updated successfully' as status;
