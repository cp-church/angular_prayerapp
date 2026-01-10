-- Update RLS policies for email_queue to restrict to admins only

-- Drop the old overly-restrictive policy if it exists
DROP POLICY IF EXISTS "Email queue only accessible via service role" ON email_queue;

-- Drop the broad authenticated user policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to enqueue emails" ON email_queue;

-- Drop the admin-only policy if it already exists
DROP POLICY IF EXISTS "Only admins can enqueue emails" ON email_queue;

-- Drop the service role policy if it already exists
DROP POLICY IF EXISTS "Service role can process queue" ON email_queue;

-- Allow admins and service role to insert into email_queue
CREATE POLICY "Only admins and service role can enqueue emails" ON email_queue
  FOR INSERT
  WITH CHECK (
    (auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM email_subscribers
      WHERE email = auth.email()
      AND is_admin = true
      AND is_active = true
    )) OR
    auth.role() = 'service_role'
  );

-- Service role can read and update (for the background processor)
CREATE POLICY "Service role can process queue" ON email_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
