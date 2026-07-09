-- Fix denomination to 100 BDT (if prior migration applied with 200)
ALTER TABLE public.prize_bonds DROP CONSTRAINT IF EXISTS prize_bonds_denomination_check;
ALTER TABLE public.prize_bonds ALTER COLUMN denomination SET DEFAULT 100;
UPDATE public.prize_bonds SET denomination = 100 WHERE denomination <> 100;
ALTER TABLE public.prize_bonds ADD CONSTRAINT prize_bonds_denomination_check CHECK (denomination = 100);
