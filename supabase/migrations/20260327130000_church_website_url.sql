-- Optional church website URL for header logo link (admin + cache)
ALTER TABLE "public"."admin_settings"
  ADD COLUMN IF NOT EXISTS "church_website_url" text;

-- Bump branding_last_modified when church_website_url changes
CREATE OR REPLACE FUNCTION update_branding_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.use_logo IS DISTINCT FROM NEW.use_logo OR
    OLD.light_mode_logo_blob IS DISTINCT FROM NEW.light_mode_logo_blob OR
    OLD.dark_mode_logo_blob IS DISTINCT FROM NEW.dark_mode_logo_blob OR
    OLD.app_title IS DISTINCT FROM NEW.app_title OR
    OLD.app_subtitle IS DISTINCT FROM NEW.app_subtitle OR
    OLD.church_website_url IS DISTINCT FROM NEW.church_website_url
  ) THEN
    NEW.branding_last_modified = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
