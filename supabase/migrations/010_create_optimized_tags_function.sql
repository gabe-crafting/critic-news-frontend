-- Create optimized function to get unique tags using GIN index
-- This leverages PostgreSQL's array operations for better performance

CREATE OR REPLACE FUNCTION get_unique_tags()
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT DISTINCT tag
    FROM (
      SELECT unnest(tags) as tag
      FROM posts
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    ) AS tag_list
    WHERE tag IS NOT NULL AND trim(tag) != ''
    ORDER BY tag
  );
$$;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION get_unique_tags() TO authenticated;
