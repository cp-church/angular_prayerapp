-- Drop last_sign_in_at column - using last_activity_date instead for all user activity tracking
ALTER TABLE email_subscribers
DROP COLUMN IF EXISTS last_sign_in_at;

-- Drop the old update_admin_last_sign_in function
DROP FUNCTION IF EXISTS update_admin_last_sign_in(TEXT);
