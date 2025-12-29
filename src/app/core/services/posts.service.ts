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

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get all posts, ordered by creation date (newest first)
   * @param limit Maximum number of posts to return
   * @param tags Optional array of tags to filter by (posts must contain at least one of these tags)
   */
  async getPosts(limit = 50, tags?: string[]): Promise<Post[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Build query
      let query = this.supabase
        .from('posts')
        .select('*');

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
        this.posts.set([]);
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];

      // Fetch user profiles
      const { data: profilesData } = await this.supabase
        .from('user_profiles')
        .select('id, name, profile_picture_url')
        .in('id', userIds);

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Combine posts with profiles
      const postsWithProfiles = postsData.map(post => ({
        ...post,
        user_profiles: profilesMap.get(post.user_id) || null
      }));

      this.posts.set(postsWithProfiles);
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
   */
  async getPostsByUser(userId: string, limit = 50): Promise<Post[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Get posts created by the user
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        throw postsError;
      }

      // Get posts shared by the user
      const { data: sharesData, error: sharesError } = await this.supabase
        .from('post_shares')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sharesError) {
        throw sharesError;
      }

      // Process regular posts
      const regularPosts: Post[] = [];
      if (postsData && postsData.length > 0) {
        // Fetch user profile (may not exist, so use maybeSingle())
        const { data: profileData } = await this.supabase
          .from('user_profiles')
          .select('id, name, profile_picture_url')
          .eq('id', userId)
          .maybeSingle();

        // Combine posts with profile
        const postsWithProfile = postsData.map(post => ({
          ...post,
          user_profiles: profileData || null
        }));
        regularPosts.push(...postsWithProfile);
      }

      // Process shared posts
      const sharedPosts: Post[] = [];
      if (sharesData && sharesData.length > 0) {
        // Get post IDs from shares
        const postIds = sharesData.map(share => share.post_id);
        
        // Fetch the original posts
        const { data: originalPostsData, error: originalPostsError } = await this.supabase
          .from('posts')
          .select('*')
          .in('id', postIds);

        if (originalPostsError) {
          throw originalPostsError;
        }

        // Get user IDs from original posts
        const originalUserIds = [...new Set((originalPostsData || []).map(p => p.user_id))];
        
        // Fetch user profiles for original post authors
        const { data: originalProfilesData } = await this.supabase
          .from('user_profiles')
          .select('id, name, profile_picture_url')
          .in('id', originalUserIds);

        // Create a map of user_id to profile
        const originalProfilesMap = new Map(
          (originalProfilesData || []).map(profile => [profile.id, profile])
        );

        // Get current user profile for shared_by
        const { data: sharerProfile } = await this.supabase
          .from('user_profiles')
          .select('id, name, profile_picture_url')
          .eq('id', userId)
          .maybeSingle();

        // Create a map of post_id to share data
        const sharesMap = new Map(sharesData.map(share => [share.post_id, share]));

        // Combine original posts with share data
        for (const originalPost of originalPostsData || []) {
          const share = sharesMap.get(originalPost.id);
          if (share) {
            sharedPosts.push({
              ...originalPost,
              original_post_id: originalPost.id,
              id: `share-${share.post_id}-${userId}`, // Unique ID for shared post
              created_at: share.created_at, // Use share date
              user_profiles: originalProfilesMap.get(originalPost.user_id) || null,
              shared_by: sharerProfile ? {
                id: sharerProfile.id,
                name: sharerProfile.name,
                profile_picture_url: sharerProfile.profile_picture_url
              } : null
            });
          }
        }
      }

      // Combine and sort by created_at (most recent first)
      const allPosts = [...regularPosts, ...sharedPosts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit);

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
        this.posts.set([]);
        this.isLoading.set(false);
        return [];
      }

      // Extract user IDs
      const followingUserIds = followingData.map(f => f.user_id);

      // Get posts from those users
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select('*')
        .in('user_id', followingUserIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        this.posts.set([]);
        this.isLoading.set(false);
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];

      // Fetch user profiles
      const { data: profilesData } = await this.supabase
        .from('user_profiles')
        .select('id, name, profile_picture_url')
        .in('id', userIds);

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Combine posts with profiles
      const postsWithProfiles = postsData.map(post => ({
        ...post,
        user_profiles: profilesMap.get(post.user_id) || null
      }));

      this.posts.set(postsWithProfiles);
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

      // Fetch user profile (may not exist, so use maybeSingle())
      const { data: profileData } = await this.supabase
        .from('user_profiles')
        .select('id, name, profile_picture_url')
        .eq('id', userId)
        .maybeSingle();

      // Combine post with profile
      const data = {
        ...postDataResult,
        user_profiles: profileData || null
      };

      // Add new post to the beginning of the posts array
      this.posts.update(posts => [data, ...posts]);
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

      // Update post in the posts array
      this.posts.update(posts =>
        posts.map(post => (post.id === postId ? updatedPost : post))
      );
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

      // Remove post from the posts array
      this.posts.update(posts => posts.filter(post => post.id !== postId));
    } catch (err: any) {
      this.error.set(err.message || 'Failed to delete post');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get all unique tags from all posts
   */
  async getAllTags(): Promise<string[]> {
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
      console.error('Failed to fetch tags:', err);
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
    } catch (err: any) {
      console.error('Failed to unshare post:', err);
      throw err;
    }
  }

  /**
   * Check if a user has shared a post
   */
  async hasSharedPost(userId: string, postId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('post_shares')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    } catch (err: any) {
      console.error('Failed to check if post is shared:', err);
      return false;
    }
  }
}

