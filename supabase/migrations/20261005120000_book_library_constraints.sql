-- Harden book_library: length checks, duplicate guard, updated_at trigger

-- Keep the oldest row when title+author collide (case/whitespace insensitive)
DELETE FROM public.book_library a
USING public.book_library b
WHERE a.user_id = b.user_id
  AND lower(trim(a.title)) = lower(trim(b.title))
  AND lower(trim(coalesce(a.author, ''))) = lower(trim(coalesce(b.author, '')))
  AND (
    a.created_at > b.created_at
    OR (a.created_at = b.created_at AND a.id::text > b.id::text)
  );

ALTER TABLE public.book_library
  DROP CONSTRAINT IF EXISTS book_library_title_check;

ALTER TABLE public.book_library
  DROP CONSTRAINT IF EXISTS book_library_title_len;

ALTER TABLE public.book_library
  ADD CONSTRAINT book_library_title_len CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 200);

ALTER TABLE public.book_library
  DROP CONSTRAINT IF EXISTS book_library_author_len;
ALTER TABLE public.book_library
  ADD CONSTRAINT book_library_author_len CHECK (author IS NULL OR char_length(author) <= 120);

ALTER TABLE public.book_library
  DROP CONSTRAINT IF EXISTS book_library_note_len;
ALTER TABLE public.book_library
  ADD CONSTRAINT book_library_note_len CHECK (note IS NULL OR char_length(note) <= 1000);

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_library_user_title_author
  ON public.book_library (user_id, lower(trim(title)), lower(trim(coalesce(author, ''))));

DROP TRIGGER IF EXISTS update_book_library_updated_at ON public.book_library;
CREATE TRIGGER update_book_library_updated_at
  BEFORE UPDATE ON public.book_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
