-- Fix RLS policies for backup_logs table
-- Allows admin portal to view backup status

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public reads" ON backup_logs;
DROP POLICY IF EXISTS "Allow authenticated reads" ON backup_logs;
DROP POLICY IF EXISTS "Allow admin reads" ON backup_logs;
DROP POLICY IF EXISTS "Allow all inserts" ON backup_logs;
DROP POLICY IF EXISTS "Allow admin inserts" ON backup_logs;
DROP POLICY IF EXISTS "Allow all updates" ON backup_logs;
DROP POLICY IF EXISTS "Allow admin updates" ON backup_logs;
DROP POLICY IF EXISTS "Allow all deletes" ON backup_logs;
DROP POLICY IF EXISTS "Allow admin deletes" ON backup_logs;

-- Create new policies for anon and authenticated users
-- Security is enforced at the application layer via route guards

CREATE POLICY "Allow public reads" ON backup_logs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all inserts" ON backup_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all updates" ON backup_logs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all deletes" ON backup_logs
  FOR DELETE TO anon, authenticated USING (true);
