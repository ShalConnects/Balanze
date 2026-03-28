-- Optional source module for transactions (e.g. business investment tracker); list UI can lock edit/delete.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS origin TEXT;

COMMENT ON COLUMN public.transactions.origin IS 'Optional: e.g. business_investment when created from Investments contracts';
