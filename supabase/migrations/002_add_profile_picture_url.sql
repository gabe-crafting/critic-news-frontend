-- Add profile_picture_url column to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create index on profile_picture_url for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_picture_url ON public.user_profiles(profile_picture_url) WHERE profile_picture_url IS NOT NULL;

