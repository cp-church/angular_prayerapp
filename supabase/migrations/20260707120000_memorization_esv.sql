-- Memorized verses/books per user + shared ESV scripture cache (with LRU verse budget).

CREATE TABLE IF NOT EXISTS public.scripture_cache (
  reference text NOT NULL,
  translation text NOT NULL,
  text text NOT NULL,
  verse_count integer NOT NULL DEFAULT 1,
  cached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reference, translation),
  CONSTRAINT scripture_cache_verse_count_positive_check CHECK (verse_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_scripture_cache_cached_at
  ON public.scripture_cache (cached_at);

ALTER TABLE public.scripture_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scripture_cache_select_authenticated ON public.scripture_cache;
CREATE POLICY scripture_cache_select_authenticated ON public.scripture_cache
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.scripture_cache TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.scripture_cache TO service_role;

CREATE OR REPLACE FUNCTION public.prune_scripture_cache(
  p_max_verses integer DEFAULT 500,
  p_ttl_cutoff timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verses_to_evict integer;
BEGIN
  IF p_ttl_cutoff IS NOT NULL THEN
    DELETE FROM public.scripture_cache
    WHERE cached_at < p_ttl_cutoff;
  END IF;

  IF p_max_verses IS NULL OR p_max_verses <= 0 THEN
    RETURN;
  END IF;

  SELECT GREATEST(0, COALESCE(SUM(verse_count), 0) - p_max_verses)
    INTO verses_to_evict
  FROM public.scripture_cache;

  IF verses_to_evict <= 0 THEN
    RETURN;
  END IF;

  DELETE FROM public.scripture_cache sc
  WHERE (sc.reference, sc.translation) IN (
    WITH ranked AS (
      SELECT
        reference,
        translation,
        SUM(verse_count) OVER (ORDER BY cached_at ASC, reference ASC) AS evict_running
      FROM public.scripture_cache
    ),
    cutoff AS (
      SELECT MIN(evict_running) AS max_running
      FROM ranked
      WHERE evict_running >= verses_to_evict
    )
    SELECT ranked.reference, ranked.translation
    FROM ranked, cutoff
    WHERE cutoff.max_running IS NOT NULL
      AND ranked.evict_running <= cutoff.max_running
  );
END;
$$;

REVOKE ALL ON FUNCTION public.prune_scripture_cache(integer, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_scripture_cache(integer, timestamptz) TO service_role;

CREATE TABLE IF NOT EXISTS public.memorized_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  reference text NOT NULL,
  text text NOT NULL DEFAULT '',
  translation text NOT NULL DEFAULT 'esv',
  kind text NOT NULL DEFAULT 'verse'
    CHECK (kind IN ('verse', 'bibleBooks')),
  bible_books_scope text
    CHECK (bible_books_scope IS NULL OR bible_books_scope IN ('all', 'ot', 'nt')),
  date_added timestamptz NOT NULL DEFAULT now(),
  last_practiced_at timestamptz,
  practice_sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
  in_progress_practice jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memorized_items_kind_scope_consistency_check
    CHECK (
      (kind = 'bibleBooks' AND bible_books_scope IS NOT NULL)
      OR (kind = 'verse' AND bible_books_scope IS NULL)
    ),
  CONSTRAINT memorized_items_verse_esv_text_check
    CHECK (
      (kind = 'verse' AND text = '')
      OR (kind = 'bibleBooks' AND length(trim(text)) > 0)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS memorized_items_verse_unique
  ON public.memorized_items (lower(user_email), reference, translation)
  WHERE kind = 'verse';

CREATE UNIQUE INDEX IF NOT EXISTS memorized_items_bible_books_unique
  ON public.memorized_items (lower(user_email), bible_books_scope)
  WHERE kind = 'bibleBooks';

CREATE INDEX IF NOT EXISTS idx_memorized_items_user_date
  ON public.memorized_items (lower(user_email), date_added DESC);

ALTER TABLE public.memorized_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memorized_items_select_own ON public.memorized_items;
CREATE POLICY memorized_items_select_own ON public.memorized_items
  FOR SELECT TO authenticated
  USING (lower(user_email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS memorized_items_insert_own ON public.memorized_items;
CREATE POLICY memorized_items_insert_own ON public.memorized_items
  FOR INSERT TO authenticated
  WITH CHECK (lower(user_email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS memorized_items_update_own ON public.memorized_items;
CREATE POLICY memorized_items_update_own ON public.memorized_items
  FOR UPDATE TO authenticated
  USING (lower(user_email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(user_email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS memorized_items_delete_own ON public.memorized_items;
CREATE POLICY memorized_items_delete_own ON public.memorized_items
  FOR DELETE TO authenticated
  USING (lower(user_email) = lower(auth.jwt() ->> 'email'));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.memorized_items TO anon, authenticated, service_role;

-- MFA / localStorage auth uses the anon key without a Supabase JWT (same pattern as
-- user_prayer_hour_reminders and device_tokens).
DROP POLICY IF EXISTS anon_memorized_items_mfa_access ON public.memorized_items;
CREATE POLICY anon_memorized_items_mfa_access
  ON public.memorized_items
  AS PERMISSIVE
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_memorized_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS memorized_items_updated_at ON public.memorized_items;
CREATE TRIGGER memorized_items_updated_at
  BEFORE UPDATE ON public.memorized_items
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_memorized_items_updated_at();

-- Existing installs: drop stored ESV text from verse rows; enforce reference-only storage.
UPDATE public.memorized_items SET text = '' WHERE kind = 'verse';

ALTER TABLE public.memorized_items DROP CONSTRAINT IF EXISTS memorized_items_verse_esv_text_check;
ALTER TABLE public.memorized_items ADD CONSTRAINT memorized_items_verse_esv_text_check
  CHECK (
    (kind = 'verse' AND text = '')
    OR (kind = 'bibleBooks' AND length(trim(text)) > 0)
  );
