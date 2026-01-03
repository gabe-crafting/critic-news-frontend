-- Create optimized function to add tag to usually_viewed_tags array
-- This avoids the SELECT + UPDATE pattern for better performance

CREATE OR REPLACE FUNCTION add_usually_viewed_tag(p_user_id UUID, p_tag TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tags TEXT[];
  updated_tags TEXT[];
BEGIN
  -- Get current tags (handle null case)
  SELECT COALESCE(usually_viewed_tags, '{}') INTO current_tags
  FROM user_profiles
  WHERE id = p_user_id;

  -- Check if tag already exists (case-insensitive)
  IF NOT (LOWER(p_tag) = ANY (SELECT LOWER(tag) FROM unnest(current_tags) AS tag)) THEN
    -- Add new tag to the end and keep only the last 10
    updated_tags := (current_tags || p_tag)[GREATEST(array_length(current_tags || p_tag, 1) - 9, 1):];

    -- Update the profile
    UPDATE user_profiles
    SET usually_viewed_tags = updated_tags,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_user_id;
  END IF;
END;
$$
LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_usually_viewed_tag(UUID, TEXT) TO authenticated;
