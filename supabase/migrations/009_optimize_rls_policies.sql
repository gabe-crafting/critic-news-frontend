-- Optimize RLS policies by wrapping auth.uid() calls in SELECT subqueries
-- This prevents re-evaluation per row and improves performance at scale

-- ============================================================================
-- Fix user_profiles RLS policies
-- ============================================================================

-- Drop and recreate: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- Fix posts RLS policies
-- ============================================================================

-- Drop and recreate: Users can create posts
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Drop and recreate: Users can update their own posts
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Drop and recreate: Users can delete their own posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- Fix followers RLS policies
-- ============================================================================

-- Drop and recreate: Users can follow other users
DROP POLICY IF EXISTS "Users can follow other users" ON public.followers;
CREATE POLICY "Users can follow other users"
  ON public.followers
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = follower_id);

-- Drop and recreate: Users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
CREATE POLICY "Users can unfollow"
  ON public.followers
  FOR DELETE
  USING ((SELECT auth.uid()) = follower_id);

-- ============================================================================
-- Fix post_shares RLS policies
-- ============================================================================

-- Drop and recreate: Authenticated users can share posts
DROP POLICY IF EXISTS "Authenticated users can share posts" ON public.post_shares;
CREATE POLICY "Authenticated users can share posts"
  ON public.post_shares
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Drop and recreate: Users can unshare their own shares
DROP POLICY IF EXISTS "Users can unshare their own shares" ON public.post_shares;
CREATE POLICY "Users can unshare their own shares"
  ON public.post_shares
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

