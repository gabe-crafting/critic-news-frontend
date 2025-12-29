-- Add usually_viewed_tags column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS usually_viewed_tags TEXT[] DEFAULT '{}' NOT NULL;

-- Create index for array operations
CREATE INDEX IF NOT EXISTS idx_user_profiles_usually_viewed_tags ON public.user_profiles USING GIN (usually_viewed_tags);

