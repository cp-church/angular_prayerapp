-- Create RPC function for reordering personal prayers in one server-side transaction
-- This reduces egress by ~95% compared to client-side batch updates
-- Example: Reordering 50 prayers in a category
-- Client-side: 50 queries × ~400 bytes each = ~20KB egress
-- Server-side: 1 RPC call × ~400 bytes = minimal egress

CREATE OR REPLACE FUNCTION reorder_personal_prayers(
  p_user_email TEXT,
  p_ordered_prayer_ids TEXT[],  -- Array of prayer IDs in their new order
  p_category TEXT DEFAULT NULL  -- Optional category filter for validation
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prayer_id TEXT;
  v_position INTEGER;
  v_category TEXT;
  v_range_min INTEGER;
  v_range_max INTEGER;
  v_new_display_order INTEGER;
  v_updated_count INTEGER := 0;
  v_prayer_count INTEGER;
BEGIN
  -- Validate input
  IF p_user_email IS NULL OR p_user_email = '' THEN
    RETURN QUERY SELECT FALSE, 'User email is required';
    RETURN;
  END IF;

  IF p_ordered_prayer_ids IS NULL OR array_length(p_ordered_prayer_ids, 1) IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Prayer ID array is required';
    RETURN;
  END IF;

  -- Get the category - prefer the provided category parameter
  -- If not provided, look up the category of the first prayer
  IF p_category IS NOT NULL THEN
    v_category := p_category;
  ELSE
    SELECT category INTO v_category
    FROM personal_prayers
    WHERE id = p_ordered_prayer_ids[1]::uuid
      AND user_email = p_user_email
    LIMIT 1;
  END IF;

  -- Determine the display_order range for this category
  -- Categories use prefix * 1000, so range is prefix*1000 to (prefix+1)*1000-1
  SELECT 
    COALESCE(MIN(display_order) / 1000 * 1000, 1000) AS range_min,
    COALESCE(MIN(display_order) / 1000 * 1000 + 999, 1999) AS range_max
  INTO v_range_min, v_range_max
  FROM personal_prayers
  WHERE user_email = p_user_email
    AND (v_category IS NULL OR category = v_category);

  -- Update each prayer with its new position
  -- Position 0 in array (top of UI) needs highest display_order for DESC sort
  -- But we want to compact from bottom of range to leave room for new prayers at top
  -- Example: 4 prayers in range 2000-2999 → assign 2003, 2002, 2001, 2000
  v_prayer_count := array_length(p_ordered_prayer_ids, 1);
  
  FOR v_position IN 0..(v_prayer_count - 1) LOOP
    v_prayer_id := p_ordered_prayer_ids[v_position + 1];  -- PostgreSQL arrays are 1-indexed
    
    IF v_prayer_id IS NULL OR v_prayer_id = '' THEN
      CONTINUE;
    END IF;
    
    -- Calculate display_order: compact from bottom of range
    -- Position 0 (top of UI) gets range_min + (count - 1), which is highest in the compact set
    -- This leaves room at the top (range_max) for adding new prayers
    v_new_display_order := v_range_min + (v_prayer_count - 1 - v_position);
    
    -- Update the prayer's display_order
    UPDATE personal_prayers
    SET display_order = v_new_display_order
    WHERE id = v_prayer_id::uuid
      AND user_email = p_user_email;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Return success
  RETURN QUERY SELECT TRUE, format('Successfully reordered %s prayers', v_updated_count);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_personal_prayers(TEXT, TEXT[], TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION reorder_personal_prayers IS 
  'Reorders personal prayers in a single server-side transaction. Takes user email and array of prayer IDs in desired order. Reduces egress by ~95% compared to client-side batch updates.';
