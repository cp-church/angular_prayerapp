-- Add is_blocked column to email_subscribers table
ALTER TABLE email_subscribers 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false NOT NULL;

-- Create index for efficient blocking check queries
CREATE INDEX IF NOT EXISTS idx_email_subscribers_blocked 
ON email_subscribers(email) 
WHERE is_blocked = true;

-- Add comment to document the column
COMMENT ON COLUMN email_subscribers.is_blocked IS 'Indicates if the user is blocked from logging in to the application';
