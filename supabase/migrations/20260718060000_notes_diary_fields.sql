-- Ensure legacy sticky-notes table exists, then extend for day-to-day diary use.
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS entry_date DATE;

UPDATE notes
SET entry_date = COALESCE((created_at AT TIME ZONE 'UTC')::date, CURRENT_DATE)
WHERE entry_date IS NULL;

ALTER TABLE notes ALTER COLUMN entry_date SET DEFAULT CURRENT_DATE;
ALTER TABLE notes ALTER COLUMN entry_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_user_entry_date ON notes (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned_updated ON notes (user_id, pinned DESC, updated_at DESC);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notes' AND policyname = 'Users manage own notes'
  ) THEN
    CREATE POLICY "Users manage own notes" ON notes
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON notes TO authenticated;
