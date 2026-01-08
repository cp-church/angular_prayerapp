-- Add last_activity_date column to track user activity
ALTER TABLE email_subscribers
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN email_subscribers.last_activity_date IS 'Timestamp of last user activity (page view)';
