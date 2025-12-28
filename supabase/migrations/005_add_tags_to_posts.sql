-- Add tags column to posts table (using TEXT array)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for tag filtering (using GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);

-- Add comment to explain the tags column
COMMENT ON COLUMN public.posts.tags IS 'Array of tags for filtering and categorization';

