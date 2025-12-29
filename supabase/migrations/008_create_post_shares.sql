-- Create post_shares table
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view all shares
CREATE POLICY "Users can view all shares"
  ON public.post_shares
  FOR SELECT
  USING (true);

-- Create policy: Authenticated users can share posts
CREATE POLICY "Authenticated users can share posts"
  ON public.post_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can unshare their own shares
CREATE POLICY "Users can unshare their own shares"
  ON public.post_shares
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON public.post_shares(post_id);

