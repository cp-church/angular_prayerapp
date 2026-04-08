-- Time-bucketed page_view counts for Site Analytics chart (aggregated in DB).

CREATE OR REPLACE FUNCTION public.analytics_page_view_buckets(
  p_start timestamptz,
  p_end timestamptz,
  p_bucket text
)
RETURNS TABLE(bucket_start timestamptz, event_count bigint)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_bucket IS NULL OR p_bucket NOT IN ('hour', 'day') THEN
    RAISE EXCEPTION 'invalid p_bucket: must be hour or day';
  END IF;

  IF p_start >= p_end THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    date_trunc(p_bucket, a.created_at) AS bucket_start,
    COUNT(*)::bigint AS event_count
  FROM public.analytics a
  WHERE a.event_type = 'page_view'
    AND a.created_at >= p_start
    AND a.created_at < p_end
  GROUP BY date_trunc(p_bucket, a.created_at)
  ORDER BY 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_page_view_buckets(timestamptz, timestamptz, text) TO authenticated;
