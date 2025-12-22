-- Fix RLS policies for prayer_prompts and prayer_types tables
-- Security is enforced at the application layer (admin routes protected by guards)

-- ========================================
-- prayer_prompts table
-- ========================================

DROP POLICY IF EXISTS "Allow public reads" ON prayer_prompts;
DROP POLICY IF EXISTS "Allow authenticated reads" ON prayer_prompts;
DROP POLICY IF EXISTS "Allow all inserts" ON prayer_prompts;
DROP POLICY IF EXISTS "Allow all updates" ON prayer_prompts;
DROP POLICY IF EXISTS "Allow all deletes" ON prayer_prompts;

-- Public can read prayer prompts (displayed on main site)
CREATE POLICY "Allow public reads" ON prayer_prompts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admin operations (inserts, updates, deletes)
CREATE POLICY "Allow all inserts" ON prayer_prompts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all updates" ON prayer_prompts
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes" ON prayer_prompts
  FOR DELETE TO anon, authenticated
  USING (true);

-- ========================================
-- prayer_types table
-- ========================================

DROP POLICY IF EXISTS "Allow public reads" ON prayer_types;
DROP POLICY IF EXISTS "Allow authenticated reads" ON prayer_types;
DROP POLICY IF EXISTS "Allow all inserts" ON prayer_types;
DROP POLICY IF EXISTS "Allow all updates" ON prayer_types;
DROP POLICY IF EXISTS "Allow all deletes" ON prayer_types;

-- Public can read prayer types (displayed on main site)
CREATE POLICY "Allow public reads" ON prayer_types
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admin operations (inserts, updates, deletes)
CREATE POLICY "Allow all inserts" ON prayer_types
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all updates" ON prayer_types
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes" ON prayer_types
  FOR DELETE TO anon, authenticated
  USING (true);
