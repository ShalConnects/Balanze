-- Global shopping list: categories, price history, drop list requirement

CREATE TABLE IF NOT EXISTS public.expense_note_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

ALTER TABLE public.expense_note_items
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.expense_note_categories (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_source TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS last_price NUMERIC,
  ADD COLUMN IF NOT EXISTS last_purchased_at TIMESTAMPTZ;

ALTER TABLE public.expense_note_documents
  ALTER COLUMN list_id DROP NOT NULL;

ALTER TABLE public.expense_note_documents
  ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'transaction_note';

ALTER TABLE public.expense_note_lines
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS line_total NUMERIC,
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.expense_note_price_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.expense_note_items (id) ON DELETE CASCADE,
  entry_line_id UUID UNIQUE REFERENCES public.expense_note_lines (id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  quantity NUMERIC,
  line_total NUMERIC,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delta_from_previous NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_note_item_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.expense_note_items (id) ON DELETE CASCADE,
  alias_normalized TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, alias_normalized)
);

CREATE INDEX IF NOT EXISTS idx_eni_category ON public.expense_note_items (category_id);
CREATE INDEX IF NOT EXISTS idx_enpo_item_observed ON public.expense_note_price_observations (item_id, observed_at DESC);

ALTER TABLE public.expense_note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_note_price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_note_item_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enc_own" ON public.expense_note_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enpo_own" ON public.expense_note_price_observations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ena_own" ON public.expense_note_item_aliases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
