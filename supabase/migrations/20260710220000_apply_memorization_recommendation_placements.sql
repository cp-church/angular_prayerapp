-- Atomic batch update for Memorize recommendation verse placements
-- (category_id + display_order) so cross-category moves cannot partially commit.

CREATE OR REPLACE FUNCTION public.apply_memorization_recommendation_placements(
  p_placements jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  elem jsonb;
  updated_count integer;
BEGIN
  IF p_placements IS NULL OR jsonb_typeof(p_placements) <> 'array' THEN
    RAISE EXCEPTION 'p_placements must be a JSON array';
  END IF;

  FOR elem IN SELECT value FROM jsonb_array_elements(p_placements)
  LOOP
    UPDATE public.memorization_recommendations
    SET
      category_id = (elem->>'category_id')::uuid,
      display_order = (elem->>'display_order')::integer
    WHERE id = (elem->>'id')::uuid;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count = 0 THEN
      RAISE EXCEPTION 'Unknown recommendation id %', elem->>'id';
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.apply_memorization_recommendation_placements(jsonb) IS
  'Atomically apply category_id and display_order for Memorize recommendation verses';

GRANT EXECUTE ON FUNCTION public.apply_memorization_recommendation_placements(jsonb)
  TO anon, authenticated, service_role;
