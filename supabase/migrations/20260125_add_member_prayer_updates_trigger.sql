-- Add trigger to automatically update updated_at timestamp on member_prayer_updates

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS member_prayer_updates_update_timestamp ON "public"."member_prayer_updates";

CREATE OR REPLACE FUNCTION update_member_prayer_updates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER member_prayer_updates_update_timestamp
BEFORE UPDATE ON "public"."member_prayer_updates"
FOR EACH ROW
EXECUTE FUNCTION update_member_prayer_updates_timestamp();
