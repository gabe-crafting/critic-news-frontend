-- Add foreign key relationship from posts to user_profiles
-- This allows Supabase to automatically join posts with user_profiles
ALTER TABLE public.posts
ADD CONSTRAINT posts_user_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

