-- Memorization Recite mode: admin toggle, usage ledger, is_admin fix, secured usage RPC.
-- Idempotent: safe to re-run manually after a partial or older deploy (IF NOT EXISTS,
-- CREATE OR REPLACE, DROP … IF EXISTS). Supabase CLI skips this file once recorded in
-- schema_migrations; use `supabase db execute -f …` or the SQL editor to re-apply.

-- Align is_admin() with email_subscribers (used by check-admin-status, admin MFA, and Recite RPC).
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_email IS NULL OR trim(user_email) = '' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.email_subscribers es
    WHERE lower(trim(es.email)) = lower(trim(user_email))
      AND es.is_admin IS TRUE
      AND coalesce(es.is_blocked, false) IS NOT TRUE
      AND coalesce(es.is_active, true) IS NOT FALSE
  );
END;
$$;

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS memorization_recite_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.admin_settings.memorization_recite_enabled IS
  'When true, users can practice single-verse memorization with Recite mode (Whisper STT).';

CREATE TABLE IF NOT EXISTS public.memorization_recite_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  memorized_item_id uuid REFERENCES public.memorized_items(id) ON DELETE SET NULL,
  audio_seconds numeric(12, 3) NOT NULL DEFAULT 0 CHECK (audio_seconds >= 0),
  model text NOT NULL DEFAULT 'whisper-1',
  rate_usd_per_minute numeric(10, 6) NOT NULL DEFAULT 0.006,
  estimated_cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memorization_recite_usage_created_idx
  ON public.memorization_recite_usage (created_at DESC);

ALTER TABLE public.memorization_recite_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memorization_recite_usage_admin_select ON public.memorization_recite_usage;
CREATE POLICY memorization_recite_usage_admin_select
  ON public.memorization_recite_usage
  FOR SELECT
  TO authenticated, anon
  USING (public.is_admin(auth.jwt() ->> 'email'));

GRANT SELECT ON TABLE public.memorization_recite_usage TO anon, authenticated, service_role;
GRANT INSERT ON TABLE public.memorization_recite_usage TO service_role;

-- Drop legacy signatures if a partial or older deploy already created them.
DROP FUNCTION IF EXISTS public.get_memorization_recite_usage_summary(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_memorization_recite_usage_summary(timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.get_memorization_recite_usage_summary(timestamptz, timestamptz, text, bigint);

CREATE OR REPLACE FUNCTION public.get_memorization_recite_usage_summary(
  p_start timestamptz DEFAULT date_trunc('month', now()),
  p_end timestamptz DEFAULT now(),
  p_email text DEFAULT NULL
)
RETURNS TABLE (
  attempt_count bigint,
  billable_audio_seconds numeric,
  estimated_cost_usd numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_email text;
  v_email text;
  v_p_email text;
BEGIN
  v_jwt_email := nullif(trim(lower(coalesce(auth.jwt() ->> 'email', ''))), '');
  v_p_email := nullif(trim(lower(coalesce(p_email, ''))), '');

  IF v_jwt_email IS NOT NULL THEN
    v_email := v_jwt_email;
    IF v_p_email IS NOT NULL AND v_p_email <> v_email THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  ELSE
    v_email := v_p_email;
    IF v_email IS NULL OR v_email = '' THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
  END IF;

  IF NOT public.is_admin(v_email) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint,
    coalesce(sum(u.audio_seconds), 0),
    coalesce(sum(u.estimated_cost_usd), 0)
  FROM public.memorization_recite_usage u
  WHERE u.created_at >= coalesce(p_start, '-infinity'::timestamptz)
    AND u.created_at < coalesce(p_end, 'infinity'::timestamptz);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_memorization_recite_usage_summary(timestamptz, timestamptz, text)
  TO anon, authenticated;

-- Retain used admin_login codes (login audit); unrelated to Recite auth after subscriber-only check.
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW()
  OR (
    used_at IS NOT NULL
    AND action_type IS DISTINCT FROM 'admin_login'
    AND used_at < NOW() - INTERVAL '1 hour'
  );
END;
$function$;
