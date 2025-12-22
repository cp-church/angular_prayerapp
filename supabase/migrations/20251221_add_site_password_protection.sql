-- Add site-wide password protection setting to admin_settings table
-- When enabled, all users must login before accessing any page

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS require_site_login BOOLEAN DEFAULT false NOT NULL;

-- Add comment explaining the feature
COMMENT ON COLUMN admin_settings.require_site_login IS 
'When true, all users must authenticate via admin-login before accessing any page. Admins get full access, non-admins see public pages only.';
