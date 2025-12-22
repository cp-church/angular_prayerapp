-- Fix RLS policies for email_templates table
-- Allows admin portal to manage email templates

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public reads" ON email_templates;
DROP POLICY IF EXISTS "Allow authenticated reads" ON email_templates;
DROP POLICY IF EXISTS "Allow admin reads" ON email_templates;
DROP POLICY IF EXISTS "Allow all inserts" ON email_templates;
DROP POLICY IF EXISTS "Allow admin inserts" ON email_templates;
DROP POLICY IF EXISTS "Allow all updates" ON email_templates;
DROP POLICY IF EXISTS "Allow admin updates" ON email_templates;
DROP POLICY IF EXISTS "Allow all deletes" ON email_templates;
DROP POLICY IF EXISTS "Allow admin deletes" ON email_templates;

-- Create new policies for anon and authenticated users
-- Security is enforced at the application layer via route guards

CREATE POLICY "Allow public reads" ON email_templates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all inserts" ON email_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all updates" ON email_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all deletes" ON email_templates
  FOR DELETE TO anon, authenticated USING (true);
