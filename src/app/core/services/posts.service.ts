import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Post {
  id: string;
  user_id: string;
  description: string;
  news_link: string;
  archive_link: string | null;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    name: string | null;
    profile_picture_url: string | null;
  } | null;
}

export interface CreatePostData {
  description: string;
  news_link: string;
  archive_link?: string;
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
   */
  async getPosts(limit = 50): Promise<Post[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // First get all posts
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select('*')
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
      // Get posts for the user
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        this.isLoading.set(false);
        return [];
      }

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

      this.isLoading.set(false);
      return postsWithProfile;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch user posts');
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
          archive_link: postData.archive_link || null
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
      const { data, error } = await this.supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update post in the posts array
      this.posts.update(posts =>
        posts.map(post => (post.id === postId ? data : post))
      );
      return data;
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
}

