CREATE TABLE IF NOT EXISTS public.book_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  author TEXT,
  owned BOOLEAN NOT NULL DEFAULT false,
  reading_status TEXT NOT NULL DEFAULT 'unread' CHECK (reading_status IN ('unread', 'reading', 'read')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_library_user_id ON public.book_library (user_id);

ALTER TABLE public.book_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_library_own" ON public.book_library;
CREATE POLICY "book_library_own" ON public.book_library
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
