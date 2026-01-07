-- Add affiliation_reason column to account_approval_requests table
-- This field allows users to explain their affiliation with the church
-- when requesting account access

ALTER TABLE account_approval_requests
ADD COLUMN IF NOT EXISTS affiliation_reason TEXT;

-- Create index for searching by reason if needed
CREATE INDEX IF NOT EXISTS idx_account_approval_requests_reason 
ON account_approval_requests(affiliation_reason);
