-- Bangladesh Prize Bond tracker (100 BDT)
CREATE TABLE IF NOT EXISTS public.prize_bonds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bond_number TEXT NOT NULL CHECK (bond_number ~ '^\d{7}$'),
  denomination INTEGER NOT NULL DEFAULT 100 CHECK (denomination = 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, bond_number)
);

CREATE TABLE IF NOT EXISTS public.prize_bond_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bond_id UUID NOT NULL REFERENCES public.prize_bonds (id) ON DELETE CASCADE,
  bond_number TEXT NOT NULL,
  prize_tier TEXT NOT NULL,
  prize_amount NUMERIC NOT NULL DEFAULT 0,
  draw_date DATE NOT NULL,
  series TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bond_id, draw_date, prize_tier)
);

CREATE INDEX IF NOT EXISTS idx_prize_bonds_user ON public.prize_bonds (user_id);
CREATE INDEX IF NOT EXISTS idx_prize_bonds_number ON public.prize_bonds (bond_number);
CREATE INDEX IF NOT EXISTS idx_prize_bond_wins_user ON public.prize_bond_wins (user_id, draw_date DESC);

ALTER TABLE public.prize_bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_bond_wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pb_own" ON public.prize_bonds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pbw_own" ON public.prize_bond_wins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_prize_bonds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prize_bonds_updated_at ON public.prize_bonds;
CREATE TRIGGER prize_bonds_updated_at
  BEFORE UPDATE ON public.prize_bonds
  FOR EACH ROW EXECUTE FUNCTION public.set_prize_bonds_updated_at();
