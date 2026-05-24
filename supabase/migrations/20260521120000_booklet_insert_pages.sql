-- Custom full-page inserts for saddle-stitch booklet (after answered prayers, before prompts).
-- Admin portal uses MFA + anon Supabase client; RLS matches admin_settings / prayer_types.
-- Idempotent: safe if the table was created by a partial apply.

CREATE TABLE IF NOT EXISTS public.booklet_insert_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL,
  label text,
  mime_type text NOT NULL,
  image_data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booklet_insert_pages_mime_type_check CHECK (
    mime_type IN ('image/png', 'image/jpeg')
  )
);

CREATE INDEX IF NOT EXISTS booklet_insert_pages_sort_order_idx
  ON public.booklet_insert_pages (sort_order);

COMMENT ON TABLE public.booklet_insert_pages IS
  'Admin-uploaded PNG/JPEG pages inserted into saddle-stitch booklet after answered prayers';

ALTER TABLE public.booklet_insert_pages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booklet_insert_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booklet_insert_pages TO authenticated;
GRANT ALL ON public.booklet_insert_pages TO service_role;

-- Replace strict admin-only policy from early applies, if present.
DROP POLICY IF EXISTS "Admins manage booklet_insert_pages" ON public.booklet_insert_pages;
DROP POLICY IF EXISTS "Allow public reads on booklet_insert_pages" ON public.booklet_insert_pages;
DROP POLICY IF EXISTS "Allow all inserts on booklet_insert_pages" ON public.booklet_insert_pages;
DROP POLICY IF EXISTS "Allow all updates on booklet_insert_pages" ON public.booklet_insert_pages;
DROP POLICY IF EXISTS "Allow all deletes on booklet_insert_pages" ON public.booklet_insert_pages;

CREATE POLICY "Allow public reads on booklet_insert_pages"
  ON public.booklet_insert_pages
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all inserts on booklet_insert_pages"
  ON public.booklet_insert_pages
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all updates on booklet_insert_pages"
  ON public.booklet_insert_pages
  AS PERMISSIVE
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes on booklet_insert_pages"
  ON public.booklet_insert_pages
  AS PERMISSIVE
  FOR DELETE
  TO anon, authenticated
  USING (true);
