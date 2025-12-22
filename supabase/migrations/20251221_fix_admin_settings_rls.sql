-- Fix admin_settings RLS policies to allow updates
-- Since the app uses custom auth (not Supabase Auth), we need simpler policies
-- Security is enforced at the application layer (admin routes protected by guards)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated reads on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow authenticated updates on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow public reads on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow admin updates on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow admin inserts on admin_settings" ON admin_settings;

-- Allow anyone to read admin_settings (app title, branding, etc. are public info)
CREATE POLICY "Allow public reads on admin_settings" ON admin_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow both anon and authenticated to update/insert
-- Application layer ensures only admins can access the admin panel
CREATE POLICY "Allow all updates on admin_settings" ON admin_settings
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all inserts on admin_settings" ON admin_settings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

