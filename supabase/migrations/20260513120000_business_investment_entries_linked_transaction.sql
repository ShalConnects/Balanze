-- Link business investment entries to a posted transactions row (public transaction_id) for cascade delete + UI warnings.
ALTER TABLE public.business_investment_entries
  ADD COLUMN IF NOT EXISTS linked_transaction_id TEXT NULL;

COMMENT ON COLUMN public.business_investment_entries.linked_transaction_id IS 'transactions.transaction_id when entry was posted to the ledger; cleared if transaction removed manually';
