-- Atomic usage bump for shopping catalog items (fixes racey read-modify-write).
-- Also corrects historical +1 inflation from seeding usage_count=1 then bumping on first line.

CREATE OR REPLACE FUNCTION public.bump_expense_note_item_usage(
  p_user_id uuid,
  p_item_id uuid,
  p_observed_at timestamptz DEFAULT now(),
  p_last_price numeric DEFAULT NULL,
  p_last_price_currency text DEFAULT NULL,
  p_set_purchased boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.expense_note_items
  SET
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = p_observed_at,
    last_price = CASE WHEN p_last_price IS NOT NULL THEN p_last_price ELSE last_price END,
    last_price_currency = CASE WHEN p_last_price_currency IS NOT NULL THEN p_last_price_currency ELSE last_price_currency END,
    last_purchased_at = CASE
      WHEN p_set_purchased OR p_last_price IS NOT NULL THEN p_observed_at
      ELSE last_purchased_at
    END,
    updated_at = now()
  WHERE id = p_item_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_expense_note_item_usage(uuid, uuid, timestamptz, numeric, text, boolean)
  TO authenticated;

UPDATE public.expense_note_items
SET usage_count = GREATEST(COALESCE(usage_count, 1) - 1, 0)
WHERE usage_count > 0;
