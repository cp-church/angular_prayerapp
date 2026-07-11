-- Recommendation categories for Memorize curated verses.
-- Each recommendation belongs to exactly one category (no uncategorized).

CREATE TABLE IF NOT EXISTS public.memorization_recommendation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memorization_recommendation_categories_name_key UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS memorization_recommendation_categories_display_order_idx
  ON public.memorization_recommendation_categories (display_order);

COMMENT ON TABLE public.memorization_recommendation_categories IS
  'Admin-managed categories for Memorize recommendation verses';

ALTER TABLE public.memorization_recommendation_categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorization_recommendation_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorization_recommendation_categories TO authenticated;
GRANT ALL ON public.memorization_recommendation_categories TO service_role;

DROP POLICY IF EXISTS "Allow public reads on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories;
DROP POLICY IF EXISTS "Allow all inserts on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories;
DROP POLICY IF EXISTS "Allow all updates on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories;
DROP POLICY IF EXISTS "Allow all deletes on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories;

CREATE POLICY "Allow public reads on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all inserts on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all updates on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories
  AS PERMISSIVE
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes on memorization_recommendation_categories"
  ON public.memorization_recommendation_categories
  AS PERMISSIVE
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP TRIGGER IF EXISTS update_memorization_recommendation_categories_updated_at
  ON public.memorization_recommendation_categories;
CREATE TRIGGER update_memorization_recommendation_categories_updated_at
  BEFORE UPDATE ON public.memorization_recommendation_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bootstrap default category and attach existing recommendations.
INSERT INTO public.memorization_recommendation_categories (name, display_order)
SELECT 'General', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.memorization_recommendation_categories WHERE name = 'General'
);

ALTER TABLE public.memorization_recommendations
  ADD COLUMN IF NOT EXISTS category_id uuid;

UPDATE public.memorization_recommendations r
SET category_id = c.id
FROM public.memorization_recommendation_categories c
WHERE r.category_id IS NULL
  AND c.name = 'General';

ALTER TABLE public.memorization_recommendations
  ALTER COLUMN category_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'memorization_recommendations_category_id_fkey'
  ) THEN
    ALTER TABLE public.memorization_recommendations
      ADD CONSTRAINT memorization_recommendations_category_id_fkey
      FOREIGN KEY (category_id)
      REFERENCES public.memorization_recommendation_categories (id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS memorization_recommendations_category_id_idx
  ON public.memorization_recommendations (category_id);

CREATE INDEX IF NOT EXISTS memorization_recommendations_category_display_order_idx
  ON public.memorization_recommendations (category_id, display_order);
