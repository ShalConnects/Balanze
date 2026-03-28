-- Business investment contracts + entries (Investments page / BusinessInvestmentTracker)
CREATE TABLE IF NOT EXISTS public.business_investment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  principal NUMERIC NOT NULL CHECK (principal > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  funding_account_id UUID NOT NULL,
  funding_account_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_investment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.business_investment_contracts (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('profit', 'loss', 'principal_return')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bic_user_id ON public.business_investment_contracts (user_id);
CREATE INDEX IF NOT EXISTS idx_bic_created_at ON public.business_investment_contracts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bie_contract_id ON public.business_investment_entries (contract_id);

ALTER TABLE public.business_investment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_investment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bic_select_own" ON public.business_investment_contracts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bic_insert_own" ON public.business_investment_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bic_update_own" ON public.business_investment_contracts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bic_delete_own" ON public.business_investment_contracts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "bie_all_via_contract" ON public.business_investment_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_investment_contracts c
      WHERE c.id = contract_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_investment_contracts c
      WHERE c.id = contract_id AND c.user_id = auth.uid()
    )
  );
