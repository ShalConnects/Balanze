-- Structured shopping/expense notes (transaction-linked + master item catalog)

CREATE TABLE IF NOT EXISTS public.expense_note_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.expense_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name_normalized TEXT NOT NULL,
  display_name TEXT NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name_normalized)
);

CREATE TABLE IF NOT EXISTS public.expense_note_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.expense_note_lists (id) ON DELETE RESTRICT,
  transaction_id UUID REFERENCES public.transactions (id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL DEFAULT '',
  parsed_version SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS expense_note_documents_transaction_unique
  ON public.expense_note_documents (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.expense_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.expense_note_documents (id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.expense_note_items (id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  name_raw TEXT NOT NULL,
  amount NUMERIC,
  quantity_expr TEXT,
  amount_computed NUMERIC,
  parse_status TEXT NOT NULL DEFAULT 'ok' CHECK (parse_status IN ('ok', 'ambiguous', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enl_user ON public.expense_note_lists (user_id);
CREATE INDEX IF NOT EXISTS idx_eni_user_norm ON public.expense_note_items (user_id, name_normalized);
CREATE INDEX IF NOT EXISTS idx_end_user ON public.expense_note_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_end_tx ON public.expense_note_documents (transaction_id);
CREATE INDEX IF NOT EXISTS idx_enline_doc ON public.expense_note_lines (document_id);

ALTER TABLE public.expense_note_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_note_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_note_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enl_own" ON public.expense_note_lists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eni_own" ON public.expense_note_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "end_own" ON public.expense_note_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enline_via_doc" ON public.expense_note_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM public.expense_note_documents d WHERE d.id = document_id AND d.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.expense_note_documents d WHERE d.id = document_id AND d.user_id = auth.uid())
);
