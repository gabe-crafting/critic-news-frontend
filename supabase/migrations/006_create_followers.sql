-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_follow UNIQUE (user_id, follower_id),
  CONSTRAINT no_self_follow CHECK (user_id != follower_id)
);

-- Enable Row Level Security
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view all follower relationships
CREATE POLICY "Users can view all follower relationships"
  ON public.followers
  FOR SELECT
  USING (true);

-- Create policy: Users can follow other users
CREATE POLICY "Users can follow other users"
  ON public.followers
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Create policy: Users can unfollow (delete their own follow relationships)
CREATE POLICY "Users can unfollow"
  ON public.followers
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_followers_user_id ON public.followers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at DESC);

