-- Fix analytics RLS policy to allow public reads
-- The previous policy only allowed authenticated users, but admins use custom auth
-- Page view counts are not sensitive data and should be readable by all

-- Drop the restrictive read policy
DROP POLICY IF EXISTS "Allow authenticated reads" ON analytics;

-- Create new policy that allows both anonymous and authenticated reads
CREATE POLICY "Allow public reads" ON analytics
  FOR SELECT TO anon, authenticated
  USING (true);
