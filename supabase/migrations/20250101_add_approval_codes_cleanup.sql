-- Add cleanup function for approval codes
-- Removes expired and old used approval codes to prevent database bloat

CREATE OR REPLACE FUNCTION cleanup_expired_approval_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM approval_codes
  WHERE expires_at < NOW()  -- Delete expired codes immediately
  OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '1 hour');  -- Delete used codes after 1 hour
END;
$$ LANGUAGE plpgsql SET search_path = public;
