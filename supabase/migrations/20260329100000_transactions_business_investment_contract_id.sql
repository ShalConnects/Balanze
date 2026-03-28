-- Link transactions created from Business Investments tracker to their contract; deleting the contract removes these rows.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS business_investment_contract_id UUID REFERENCES public.business_investment_contracts (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_bic_contract_id ON public.transactions (business_investment_contract_id)
  WHERE business_investment_contract_id IS NOT NULL;

COMMENT ON COLUMN public.transactions.business_investment_contract_id IS 'FK to business_investment_contracts; CASCADE deletes when contract is removed';
