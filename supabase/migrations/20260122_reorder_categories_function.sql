-- Create RPC function for reordering all personal prayer categories in one server-side transaction
-- This reduces egress by ~95% compared to client-side batch updates
-- Example: Moving category from last to first position requires updating all categories
-- Client-side: N queries × ~200 bytes each = large egress
-- Server-side: 1 RPC call × ~400 bytes = minimal egress

CREATE OR REPLACE FUNCTION reorder_personal_prayer_categories(
  p_user_email TEXT,
  p_ordered_categories TEXT[]  -- Array of category names in their new order (position 0 = highest prefix)
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category TEXT;
  v_new_prefix INTEGER;
  v_new_display_order INTEGER;
  v_last_three_digits INTEGER;
  v_position INTEGER;
  v_updated_count INTEGER := 0;
BEGIN
  -- Validate input
  IF p_user_email IS NULL OR p_user_email = '' THEN
    RETURN QUERY SELECT FALSE, 'User email is required';
    RETURN;
  END IF;

  IF p_ordered_categories IS NULL OR array_length(p_ordered_categories, 1) IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Category array is required';
    RETURN;
  END IF;

  -- Process each category in the new order
  -- Position 0 gets prefix = array_length, position 1 gets array_length - 1, etc.
  -- This maintains DESC sort order (higher prefix = appears first)
  FOR v_position IN 0..(array_length(p_ordered_categories, 1) - 1) LOOP
    v_category := p_ordered_categories[v_position + 1];  -- PostgreSQL arrays are 1-indexed
    
    -- Skip null categories
    IF v_category IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calculate new prefix based on position
    -- Position 0 → highest prefix, position N-1 → lowest prefix
    v_new_prefix := array_length(p_ordered_categories, 1) - v_position;
    
    -- Update all prayers in this category to use the new prefix
    -- Preserve last 3 digits to maintain order within the category
    UPDATE personal_prayers
    SET display_order = (v_new_prefix * 1000) + (display_order % 1000)
    WHERE user_email = p_user_email
      AND category = v_category;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Return success
  RETURN QUERY SELECT TRUE, format('Successfully reordered %s categories', v_updated_count);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_personal_prayer_categories(TEXT, TEXT[]) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION reorder_personal_prayer_categories IS 
  'Reorders personal prayer categories in a single server-side transaction. Takes user email and array of categories in desired order. Reduces egress by ~95% compared to client-side batch updates.';
