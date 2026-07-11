-- Admin-curated verse recommendations for the Memorize tab.
-- Admin portal uses MFA + anon Supabase client; RLS matches prayer_prompts / booklet_insert_pages.

CREATE TABLE IF NOT EXISTS public.memorization_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  translation text NOT NULL DEFAULT 'esv',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memorization_recommendations_translation_check CHECK (translation = 'esv'),
  CONSTRAINT memorization_recommendations_reference_translation_key UNIQUE (reference, translation)
);

CREATE INDEX IF NOT EXISTS memorization_recommendations_display_order_idx
  ON public.memorization_recommendations (display_order);

COMMENT ON TABLE public.memorization_recommendations IS
  'Admin-curated ESV verse references shown as recommendations on the Memorize tab';

ALTER TABLE public.memorization_recommendations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorization_recommendations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorization_recommendations TO authenticated;
GRANT ALL ON public.memorization_recommendations TO service_role;

DROP POLICY IF EXISTS "Allow public reads on memorization_recommendations" ON public.memorization_recommendations;
DROP POLICY IF EXISTS "Allow all inserts on memorization_recommendations" ON public.memorization_recommendations;
DROP POLICY IF EXISTS "Allow all updates on memorization_recommendations" ON public.memorization_recommendations;
DROP POLICY IF EXISTS "Allow all deletes on memorization_recommendations" ON public.memorization_recommendations;

CREATE POLICY "Allow public reads on memorization_recommendations"
  ON public.memorization_recommendations
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all inserts on memorization_recommendations"
  ON public.memorization_recommendations
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all updates on memorization_recommendations"
  ON public.memorization_recommendations
  AS PERMISSIVE
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes on memorization_recommendations"
  ON public.memorization_recommendations
  AS PERMISSIVE
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP TRIGGER IF EXISTS update_memorization_recommendations_updated_at ON public.memorization_recommendations;
CREATE TRIGGER update_memorization_recommendations_updated_at
  BEFORE UPDATE ON public.memorization_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
