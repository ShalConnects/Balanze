CREATE TABLE IF NOT EXISTS public.prize_bond_scan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  detected_number TEXT NOT NULL CHECK (detected_number ~ '^\d{7}$'),
  confirmed_number TEXT NOT NULL CHECK (confirmed_number ~ '^\d{7}$'),
  best_region TEXT,
  region_scores JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pb_scan_feedback_user
  ON public.prize_bond_scan_feedback (user_id, created_at DESC);

ALTER TABLE public.prize_bond_scan_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pbsf_own" ON public.prize_bond_scan_feedback;
CREATE POLICY "pbsf_own" ON public.prize_bond_scan_feedback
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
