-- Backfill shopping-list currency from linked transaction accounts

UPDATE public.expense_note_lines enl
SET currency = a.currency
FROM public.expense_note_documents d
JOIN public.transactions t ON t.id = d.transaction_id
JOIN public.accounts a ON a.id = t.account_id
WHERE enl.document_id = d.id
  AND enl.currency IS NULL
  AND d.transaction_id IS NOT NULL
  AND a.currency IS NOT NULL;

UPDATE public.expense_note_price_observations enpo
SET currency = enl.currency
FROM public.expense_note_lines enl
WHERE enpo.entry_line_id = enl.id
  AND enpo.currency IS NULL
  AND enl.currency IS NOT NULL;

UPDATE public.expense_note_items i
SET last_price_currency = sub.currency
FROM (
  SELECT DISTINCT ON (item_id) item_id, currency
  FROM public.expense_note_price_observations
  WHERE currency IS NOT NULL
  ORDER BY item_id, observed_at DESC
) sub
WHERE i.id = sub.item_id
  AND i.last_price_currency IS NULL;
