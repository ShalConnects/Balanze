-- Allow additional cash deployed on the same contract (reinvest / follow-on capital)
ALTER TABLE public.business_investment_entries
  DROP CONSTRAINT IF EXISTS business_investment_entries_type_check;

ALTER TABLE public.business_investment_entries
  ADD CONSTRAINT business_investment_entries_type_check
  CHECK (type IN ('profit', 'loss', 'principal_return', 'capital_contribution'));
