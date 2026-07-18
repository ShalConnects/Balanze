-- Canonical transaction edit-history: ensure table, track account_id + note, tighten INSERT RLS.
-- Inserts are trigger-only (SECURITY DEFINER bypasses RLS); clients get SELECT only.

CREATE TABLE IF NOT EXISTS public.transaction_updates (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(8) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_updates_transaction_id ON public.transaction_updates(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_updates_updated_at ON public.transaction_updates(updated_at);
CREATE INDEX IF NOT EXISTS idx_transaction_updates_updated_by ON public.transaction_updates(updated_by);

CREATE OR REPLACE FUNCTION public.log_transaction_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'amount', OLD.amount::text, NEW.amount::text, uid);
  END IF;
  IF OLD.type IS DISTINCT FROM NEW.type THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'type', OLD.type, NEW.type, uid);
  END IF;
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'category', OLD.category, NEW.category, uid);
  END IF;
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'description', OLD.description, NEW.description, uid);
  END IF;
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'date', OLD.date::text, NEW.date::text, uid);
  END IF;
  IF OLD.tags IS DISTINCT FROM NEW.tags THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'tags', OLD.tags::text, NEW.tags::text, uid);
  END IF;
  IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'account_id', OLD.account_id::text, NEW.account_id::text, uid);
  END IF;
  IF OLD.note IS DISTINCT FROM NEW.note THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'note', OLD.note, NEW.note, uid);
  END IF;
  IF OLD.saving_amount IS DISTINCT FROM NEW.saving_amount THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'saving_amount', OLD.saving_amount::text, NEW.saving_amount::text, uid);
  END IF;
  IF OLD.is_recurring IS DISTINCT FROM NEW.is_recurring THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'is_recurring', OLD.is_recurring::text, NEW.is_recurring::text, uid);
  END IF;
  IF OLD.recurring_frequency IS DISTINCT FROM NEW.recurring_frequency THEN
    INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
    VALUES (NEW.transaction_id, 'recurring_frequency', OLD.recurring_frequency, NEW.recurring_frequency, uid);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_transaction_update ON public.transactions;
CREATE TRIGGER trigger_log_transaction_update
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_update();

ALTER TABLE public.transaction_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transaction updates" ON public.transaction_updates;
CREATE POLICY "Users can view their own transaction updates" ON public.transaction_updates
  FOR SELECT USING (
    transaction_id IN (
      SELECT transaction_id FROM public.transactions WHERE user_id = auth.uid()
    )
  );

-- Remove open client INSERT; SECURITY DEFINER trigger writes bypass RLS.
DROP POLICY IF EXISTS "System can insert transaction updates" ON public.transaction_updates;

GRANT SELECT ON public.transaction_updates TO authenticated;

-- Same INSERT lockdown for purchase history when present.
DO $$
BEGIN
  IF to_regclass('public.purchase_updates') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can insert purchase updates" ON public.purchase_updates';
  END IF;
END $$;
