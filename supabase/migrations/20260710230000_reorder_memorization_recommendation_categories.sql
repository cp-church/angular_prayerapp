-- Atomic reorder for Memorize recommendation categories (display_order).

CREATE OR REPLACE FUNCTION public.reorder_memorization_recommendation_categories(
  p_ordered_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  i integer;
  updated_count integer;
BEGIN
  IF p_ordered_ids IS NULL THEN
    RAISE EXCEPTION 'p_ordered_ids must not be null';
  END IF;

  FOR i IN 1 .. coalesce(array_length(p_ordered_ids, 1), 0)
  LOOP
    UPDATE public.memorization_recommendation_categories
    SET display_order = i - 1
    WHERE id = p_ordered_ids[i];

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count = 0 THEN
      RAISE EXCEPTION 'Unknown recommendation category id %', p_ordered_ids[i];
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.reorder_memorization_recommendation_categories(uuid[]) IS
  'Atomically set display_order for Memorize recommendation categories by id list';

GRANT EXECUTE ON FUNCTION public.reorder_memorization_recommendation_categories(uuid[])
  TO anon, authenticated, service_role;
