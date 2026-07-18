-- Repair items stuck at 0× after create-then-failed-bump (they already have note lines).
UPDATE public.expense_note_items i
SET usage_count = 1, updated_at = now()
WHERE COALESCE(i.usage_count, 0) = 0
  AND EXISTS (
    SELECT 1 FROM public.expense_note_lines l WHERE l.item_id = i.id
  );
