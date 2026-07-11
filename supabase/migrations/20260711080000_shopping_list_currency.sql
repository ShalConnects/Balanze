-- Persist currency with shopping-list prices (no FX; display/compare per currency)

ALTER TABLE public.expense_note_items
  ADD COLUMN IF NOT EXISTS last_price_currency TEXT;

ALTER TABLE public.expense_note_lines
  ADD COLUMN IF NOT EXISTS currency TEXT;

ALTER TABLE public.expense_note_price_observations
  ADD COLUMN IF NOT EXISTS currency TEXT;
