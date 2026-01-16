-- Remove unused approved_by column from prayers and prayer_updates tables
-- This column was never used in the application logic; approved_at is used instead

-- Remove approved_by from prayers table
ALTER TABLE prayers DROP COLUMN IF EXISTS approved_by;

-- Remove approved_by from prayer_updates table
ALTER TABLE prayer_updates DROP COLUMN IF EXISTS approved_by;

-- Remove approved_by from account_approval_requests table (if exists)
ALTER TABLE IF EXISTS account_approval_requests DROP COLUMN IF EXISTS approved_by;
