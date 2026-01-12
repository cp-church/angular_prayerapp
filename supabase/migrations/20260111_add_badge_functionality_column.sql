-- Add badge_functionality_enabled column to email_subscribers table
-- This column tracks whether users have enabled the notification badge functionality
-- When enabled, only new prayers and updates from that point forward will show badges

ALTER TABLE email_subscribers
ADD COLUMN badge_functionality_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN email_subscribers.badge_functionality_enabled IS 'Whether the user has enabled notification badge functionality. When enabled, all current prayers/updates are marked as read and only new items will show badges.';
