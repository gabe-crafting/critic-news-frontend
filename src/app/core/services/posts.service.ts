import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Post {
  id: string;
  user_id: string;
  description: string;
  news_link: string;
  archive_link: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    name: string | null;
    profile_picture_url: string | null;
  } | null;
  shared_by?: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  } | null;
  original_post_id?: string | null;
  is_shared_by_current_user?: boolean;
}

export interface CreatePostData {
  description: string;
  news_link: string;
  archive_link?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private get supabase() {
    return this.supabaseService.client;
  }

  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Cache for share statuses: Map<userId, Map<postId, boolean>>
  private shareStatusCache = new Map<string, Map<string, boolean>>();
  // Track pending batch requests to prevent duplicates
  private pendingShareStatusRequests = new Map<string, Promise<Map<string, boolean>>>();

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get all posts, ordered by creation date (newest first)
   * @param limit Maximum number of posts to return
   * @param tags Optional array of tags to filter by (posts must contain at least one of these tags)
   * @param currentUserId Optional user ID to check if posts are shared by current user
   */
  async getPosts(limit = 50, tags?: string[], currentUserId?: string): Promise<Post[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Build query with join to user_profiles
      let selectQuery = '*, user_profiles!inner(id, name, profile_picture_url)';
      
      let query = this.supabase
        .from('posts')
        .select(selectQuery);

      // Filter by tags if provided
      if (tags && tags.length > 0) {
        // Use overlaps operator to find posts that contain any of the specified tags
        query = query.overlaps('tags', tags);
      }

      // Execute query
      const { data: postsData, error: postsError } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get share statuses for current user if provided
      let shareStatusMap = new Map<string, boolean>();
      if (currentUserId) {
        const postIds = postsData.map((post: any) => post.id);
        const { data: sharesData } = await this.supabase
          .from('post_shares')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        if (sharesData) {
          sharesData.forEach(share => {
            shareStatusMap.set(share.post_id, true);
          });
        }
      }

      // Combine posts with share status (profiles already included via join)
      const postsWithProfiles = postsData.map((post: any) => {
        const postId = post.original_post_id || post.id;
        return {
          ...post,
          is_shared_by_current_user: currentUserId ? (shareStatusMap.get(postId) || false) : false
        };
      });

      // Don't update signals - store will handle state updates
      return postsWithProfiles;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch posts');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get posts by a specific user
   * @param userId The user whose posts to fetch
   * @param limit Maximum number of posts to return
   * @param currentUserId Optional user ID to check if posts are shared by current user (viewer)
   * @param sharerProfile Optional profile data to avoid redundant fetch (should match userId)
   */
  async getPostsByUser(
    userId: string,
    limit = 50,
    currentUserId?: string,
    sharerProfile?: { id: string; name: string | null; profile_picture_url: string | null } | null
  ): Promise<Post[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Fetch posts and shares in parallel
      const [postsResult, sharesResult] = await Promise.all([
        // Regular posts with profiles
        this.supabase
          .from('posts')
          .select('*, user_profiles!inner(id, name, profile_picture_url)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        
        // Shared posts
        this.supabase
          .from('post_shares')
          .select('post_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
      ]);

      if (postsResult.error) throw postsResult.error;
      if (sharesResult.error) throw sharesResult.error;

      const postsData = postsResult.data || [];
      const sharesData = sharesResult.data || [];
      
      // Use provided profile or fetch if needed
      let finalSharerProfile = sharerProfile;
      if (finalSharerProfile === undefined && sharesData.length > 0) {
        const sharerProfileResult = await this.supabase
          .from('user_profiles')
          .select('id, name, profile_picture_url')
          .eq('id', userId)
          .maybeSingle();
        finalSharerProfile = sharerProfileResult.data;
      }

      // Process shared posts if any
      const sharedPosts: Post[] = [];
      if (sharesData.length > 0) {
        const postIds = sharesData.map(share => share.post_id);
        const sharesMap = new Map(sharesData.map(share => [share.post_id, share]));
        
        // Fetch original posts with profiles
        const { data: originalPostsData, error: originalPostsError } = await this.supabase
          .from('posts')
          .select('*, user_profiles!inner(id, name, profile_picture_url)')
          .in('id', postIds);

        if (originalPostsError) throw originalPostsError;

        // Build shared posts array
        for (const originalPost of originalPostsData || []) {
          const share = sharesMap.get(originalPost.id);
          if (share) {
            sharedPosts.push({
              ...originalPost,
              original_post_id: originalPost.id,
              id: `share-${share.post_id}-${userId}`,
              created_at: share.created_at,
              shared_by: finalSharerProfile ? {
                id: finalSharerProfile.id,
                name: finalSharerProfile.name,
                profile_picture_url: finalSharerProfile.profile_picture_url
              } : null
            });
          }
        }
      }

      // Combine and sort by created_at (most recent first)
      const allPosts = [...postsData, ...sharedPosts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit);

      // Get share statuses for current user if provided
      if (currentUserId && allPosts.length > 0) {
        const postIds = allPosts.map(post => post.original_post_id || post.id);
        const { data: currentUserSharesData } = await this.supabase
          .from('post_shares')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        const shareStatusSet = new Set(
          (currentUserSharesData || []).map(share => share.post_id)
        );

        // Add share status in single pass
        allPosts.forEach(post => {
          const postId = post.original_post_id || post.id;
          (post as any).is_shared_by_current_user = shareStatusSet.has(postId);
        });
      } else {
        // Set to false in single pass
        allPosts.forEach(post => {
          (post as any).is_shared_by_current_user = false;
        });
      }

      this.isLoading.set(false);
      return allPosts;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch user posts');
      this.isLoading.set(false);
      throw err;
    }
  }

  /**
   * Get posts from users that the current user follows
   */
  async getPostsFromFollowing(followerId: string, limit = 50): Promise<Post[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // First, get all users that the current user follows
      const { data: followingData, error: followingError } = await this.supabase
        .from('followers')
        .select('user_id')
        .eq('follower_id', followerId);

      if (followingError) {
        throw followingError;
      }

      if (!followingData || followingData.length === 0) {
        this.isLoading.set(false);
        return [];
      }

      // Extract user IDs
      const followingUserIds = followingData.map(f => f.user_id);

      // Get posts from those users with user profiles joined
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select('*, user_profiles!inner(id, name, profile_picture_url)')
        .in('user_id', followingUserIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        this.isLoading.set(false);
        return [];
      }

      // Get share statuses for current user
      const postIds = postsData.map((post: any) => post.id);
      const { data: sharesData } = await this.supabase
        .from('post_shares')
        .select('post_id')
        .eq('user_id', followerId)
        .in('post_id', postIds);

      const shareStatusMap = new Map<string, boolean>();
      if (sharesData) {
        sharesData.forEach(share => {
          shareStatusMap.set(share.post_id, true);
        });
      }

      // Combine posts with share status (profiles already included via join)
      const postsWithProfiles = postsData.map((post: any) => {
        const postId = post.original_post_id || post.id;
        return {
          ...post,
          is_shared_by_current_user: shareStatusMap.get(postId) || false
        };
      });

      // Don't update signals - store will handle state updates
      this.isLoading.set(false);
      return postsWithProfiles;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch following posts');
      this.isLoading.set(false);
      throw err;
    }
  }

  /**
   * Create a new post
   */
  async createPost(userId: string, postData: CreatePostData): Promise<Post> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Check if user has a profile with a name before creating post
      const { data: profileData, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('id, name')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData || !profileData.name || !profileData.name.trim()) {
        throw new Error('You need to add a name to your profile before posting. Please edit your profile first.');
      }

      // Insert the post
      const { data: postDataResult, error: insertError } = await this.supabase
        .from('posts')
        .insert({
          user_id: userId,
          description: postData.description,
          news_link: postData.news_link,
          archive_link: null,
          tags: postData.tags && postData.tags.length > 0 ? postData.tags : null
        })
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }

      // Fetch user profile with picture URL for display
      const { data: fullProfileData } = await this.supabase
        .from('user_profiles')
        .select('id, name, profile_picture_url')
        .eq('id', userId)
        .maybeSingle();

      // Combine post with profile
      const data = {
        ...postDataResult,
        user_profiles: fullProfileData || null,
        is_shared_by_current_user: false
      };

      // Don't update signals - store will handle state updates
      return data;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to create post');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, updates: Partial<CreatePostData>): Promise<Post> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data: postData, error } = await this.supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      // Fetch user profile (may not exist, so use maybeSingle())
      const { data: profileData } = await this.supabase
        .from('user_profiles')
        .select('id, name, profile_picture_url')
        .eq('id', postData.user_id)
        .maybeSingle();

      // Combine post with profile
      const updatedPost = {
        ...postData,
        user_profiles: profileData || null
      };

      // Don't update signals - store will handle state updates
      return updatedPost;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to update post');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { error } = await this.supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      // Don't update signals - store will handle state updates
    } catch (err: any) {
      this.error.set(err.message || 'Failed to delete post');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get all unique tags from all posts
   * Uses optimized PostgreSQL query with GIN index
   */
  async getAllTags(): Promise<string[]> {
    try {
      // Use unnest() to flatten all tag arrays, then get distinct values
      // This leverages the GIN index for optimal performance
      const { data, error } = await this.supabase
        .rpc('get_unique_tags');

      if (error) {
        // Fallback to the old method if RPC doesn't exist
        console.warn('RPC function not found, falling back to client-side processing');
        return this.getAllTagsFallback();
      }

      return (data as string[]) || [];
    } catch (err: any) {
      console.error('Failed to fetch tags:', err);
      return [];
    }
  }

  /**
   * Fallback method for getting unique tags (client-side processing)
   */
  private async getAllTagsFallback(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('tags');

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      // Collect all tags from all posts
      const allTags = new Set<string>();
      data.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      });

      // Convert to sorted array
      return Array.from(allTags).sort();
    } catch (err: any) {
      console.error('Failed to fetch tags (fallback):', err);
      return [];
    }
  }

  /**
   * Share a post to user's profile
   */
  async sharePost(userId: string, postId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('post_shares')
        .insert({
          user_id: userId,
          post_id: postId
        });

      if (error) {
        throw error;
      }

      // Update cache
      let userCache = this.shareStatusCache.get(userId);
      if (!userCache) {
        userCache = new Map();
        this.shareStatusCache.set(userId, userCache);
      }
      userCache.set(postId, true);
    } catch (err: any) {
      console.error('Failed to share post:', err);
      throw err;
    }
  }

  /**
   * Unshare a post from user's profile
   */
  async unsharePost(userId: string, postId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('post_shares')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        throw error;
      }

      // Update cache
      const userCache = this.shareStatusCache.get(userId);
      if (userCache) {
        userCache.set(postId, false);
      }
    } catch (err: any) {
      console.error('Failed to unshare post:', err);
      throw err;
    }
  }

  /**
   * Batch fetch share statuses for multiple posts for a user
   * This prevents N+1 queries when checking share status for many posts
   */
  async getShareStatusesForPosts(userId: string, postIds: string[]): Promise<Map<string, boolean>> {
    if (postIds.length === 0) {
      return new Map();
    }

    // Check if we have a pending request for this user
    const cacheKey = userId;
    if (this.pendingShareStatusRequests.has(cacheKey)) {
      const pendingResult = await this.pendingShareStatusRequests.get(cacheKey)!;
      // Filter to only return statuses for requested postIds
      const result = new Map<string, boolean>();
      postIds.forEach(postId => {
        result.set(postId, pendingResult.get(postId) || false);
      });
      return result;
    }

    // Check cache first
    const userCache = this.shareStatusCache.get(userId);
    if (userCache) {
      const allCached = postIds.every(postId => userCache.has(postId));
      if (allCached) {
        const result = new Map<string, boolean>();
        postIds.forEach(postId => {
          result.set(postId, userCache.get(postId) || false);
        });
        return result;
      }
    }

    // Fetch missing share statuses
    const requestPromise = this.fetchShareStatuses(userId, postIds);
    this.pendingShareStatusRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingShareStatusRequests.delete(cacheKey);
    }
  }

  /**
   * Internal method to fetch share statuses from database
   */
  private async fetchShareStatuses(userId: string, postIds: string[]): Promise<Map<string, boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('post_shares')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (error) {
        throw error;
      }

      // Create a set of shared post IDs
      const sharedPostIds = new Set((data || []).map(share => share.post_id));

      // Build result map
      const result = new Map<string, boolean>();
      postIds.forEach(postId => {
        result.set(postId, sharedPostIds.has(postId));
      });

      // Update cache
      let userCache = this.shareStatusCache.get(userId);
      if (!userCache) {
        userCache = new Map();
        this.shareStatusCache.set(userId, userCache);
      }
      result.forEach((isShared, postId) => {
        userCache!.set(postId, isShared);
      });

      return result;
    } catch (err: any) {
      console.error('Failed to fetch share statuses:', err);
      // Return all false on error
      const result = new Map<string, boolean>();
      postIds.forEach(postId => {
        result.set(postId, false);
      });
      return result;
    }
  }

  /**
   * Check if a user has shared a post
   * Uses cache if available, otherwise makes a single request
   */
  async hasSharedPost(userId: string, postId: string): Promise<boolean> {
    // Check cache first
    const userCache = this.shareStatusCache.get(userId);
    if (userCache?.has(postId)) {
      return userCache.get(postId) || false;
    }

    // If not in cache, fetch it (will also cache it)
    const statuses = await this.getShareStatusesForPosts(userId, [postId]);
    return statuses.get(postId) || false;
  }

  /**
   * Clear share status cache for a user (useful on logout or when shares change)
   */
  clearShareStatusCache(userId?: string): void {
    if (userId) {
      this.shareStatusCache.delete(userId);
    } else {
      this.shareStatusCache.clear();
    }
  }
}

