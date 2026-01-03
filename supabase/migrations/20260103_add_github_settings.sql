-- Migration: Add GitHub Feedback Settings to admin_settings table
-- Description: Add columns to store GitHub repository configuration for feedback integration
-- Created: 2026-01-03
-- Note: GitHub token should be encrypted at the application level using Supabase encryption

-- Add GitHub configuration columns to admin_settings table
ALTER TABLE admin_settings
ADD COLUMN IF NOT EXISTS github_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS github_repo_owner TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS github_repo_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT FALSE;

-- Add comments to clarify the columns
COMMENT ON COLUMN admin_settings.github_token IS 'GitHub Personal Access Token for creating issues (encrypted at application level)';
COMMENT ON COLUMN admin_settings.github_repo_owner IS 'GitHub repository owner (username or organization)';
COMMENT ON COLUMN admin_settings.github_repo_name IS 'GitHub repository name';
COMMENT ON COLUMN admin_settings.enabled IS 'Whether GitHub feedback integration is enabled';

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_settings'
AND column_name IN ('github_token', 'github_repo_owner', 'github_repo_name', 'enabled')
ORDER BY ordinal_position;
