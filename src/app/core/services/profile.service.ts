import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string | null;
  description: string | null;
  profile_picture_url: string | null;
  usually_viewed_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private get supabase() {
    return this.supabaseService.client;
  }

  readonly currentProfile = signal<UserProfile | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Cache for profiles by user ID
  private profileCache = new Map<string, UserProfile | null>();
  // Track pending requests to prevent duplicate concurrent requests
  private pendingRequests = new Map<string, Promise<UserProfile | null>>();

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Clear the profile cache
   * Useful when user logs out or when you want to force fresh data
   */
  clearCache(): void {
    this.profileCache.clear();
    this.pendingRequests.clear();
    this.currentProfile.set(null);
  }

  /**
   * Get user profile by user ID
   * Uses caching to prevent duplicate requests
   */
  async getProfile(userId: string, forceRefresh = false): Promise<UserProfile | null> {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && this.profileCache.has(userId)) {
      const cachedProfile = this.profileCache.get(userId)!; // Safe because we checked has() above
      // Update currentProfile signal if this is the current user's profile
      const currentProfile = this.currentProfile();
      if (currentProfile?.id === userId || !currentProfile) {
        this.currentProfile.set(cachedProfile);
      }
      return cachedProfile;
    }

    // Check if there's already a pending request for this user
    if (this.pendingRequests.has(userId)) {
      return this.pendingRequests.get(userId)!;
    }

    // Create new request
    const requestPromise = this.fetchProfile(userId);
    this.pendingRequests.set(userId, requestPromise);

    try {
      const profile = await requestPromise;
      return profile;
    } finally {
      this.pendingRequests.delete(userId);
    }
  }

  /**
   * Internal method to fetch profile from database
   */
  private async fetchProfile(userId: string): Promise<UserProfile | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, return null (not an error)
        if (error.code === 'PGRST116') {
          this.profileCache.set(userId, null);
          this.currentProfile.set(null);
          return null;
        }
        throw error;
      }

      // Cache the profile
      this.profileCache.set(userId, data);
      
      // Update currentProfile signal if this is the current user's profile
      const currentProfile = this.currentProfile();
      if (currentProfile?.id === userId || !currentProfile) {
        this.currentProfile.set(data);
      }
      
      return data;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch profile');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get all user profiles
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch profiles');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }


  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: { name?: string; description?: string; profile_picture_url?: string | null }): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  }

  /**
   * Resize image to reduce file size
   * @param file Original image file
   * @param maxWidth Maximum width in pixels (default: 400)
   * @param maxHeight Maximum height in pixels (default: 400)
   * @param quality JPEG quality 0-1 (default: 0.8)
   * @returns Resized image as Blob
   */
  async resizeImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload profile picture to Supabase Storage
   * @param userId User ID
   * @param file Image file to upload
   * @returns Updated user profile
   */
  async uploadProfilePicture(userId: string, file: File): Promise<UserProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Resize image before upload
      const resizedBlob = await this.resizeImage(file, 400, 400, 0.8);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });

      // Generate unique filename
      const fileExt = resizedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Delete old profile picture if exists
      const profile = this.currentProfile();
      if (profile?.profile_picture_url) {
        try {
          // Extract path from URL (format: .../profile-pictures/userId/filename)
          const urlParts = profile.profile_picture_url.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'profile-pictures');
          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            const oldPath = urlParts.slice(bucketIndex + 1).join('/');
            await this.supabase.storage.from('profile-pictures').remove([oldPath]);
          }
        } catch (err) {
          // Ignore errors when deleting old picture
          console.warn('Failed to delete old profile picture:', err);
        }
      }

      // Upload new picture
      const { data, error } = await this.supabase.storage
        .from('profile-pictures')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Update profile with new picture URL
      const updatedProfile = await this.updateProfile(userId, { profile_picture_url: urlData.publicUrl });

      return updatedProfile;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to upload profile picture');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(userId: string): Promise<UserProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const profile = this.currentProfile();
      if (!profile?.profile_picture_url) {
        // If no profile picture, get the current profile and return it unchanged
        const currentProfile = await this.getProfile(userId);
        if (!currentProfile) {
          throw new Error('Profile not found');
        }
        return currentProfile;
      }

      // Extract file path from URL (format: .../profile-pictures/userId/filename)
      const urlParts = profile.profile_picture_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'profile-pictures');
      if (bucketIndex === -1 || bucketIndex >= urlParts.length - 1) {
        throw new Error('Invalid profile picture URL format');
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('profile-pictures')
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Update profile to remove URL
      const updatedProfile = await this.updateProfile(userId, { profile_picture_url: null });

      return updatedProfile;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to delete profile picture');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, followerId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (userId === followerId) {
        throw new Error('Cannot follow yourself');
      }

      const { error } = await this.supabase
        .from('followers')
        .insert({
          user_id: userId,
          follower_id: followerId
        });

      if (error) {
        // If it's a unique constraint violation, user is already following
        if (error.code === '23505') {
          return; // Already following, no error
        }
        throw error;
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to follow user');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, followerId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { error } = await this.supabase
        .from('followers')
        .delete()
        .eq('user_id', userId)
        .eq('follower_id', followerId);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to unfollow user');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Check if current user is following a user
   */
  async isFollowing(userId: string, followerId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('followers')
        .select('id')
        .eq('user_id', userId)
        .eq('follower_id', followerId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    } catch (err: any) {
      console.error('Failed to check follow status:', err);
      return false;
    }
  }

  /**
   * Get followers count for a user
   */
  async getFollowersCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (err: any) {
      console.error('Failed to get followers count:', err);
      return 0;
    }
  }

  /**
   * Get following count for a user
   */
  async getFollowingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (err: any) {
      console.error('Failed to get following count:', err);
      return 0;
    }
  }

  /**
   * Get follow status for multiple users (which ones the current user follows)
   */
  async getFollowStatusForUsers(userIds: string[], followerId: string): Promise<Set<string>> {
    if (userIds.length === 0) {
      return new Set();
    }

    try {
      const { data, error } = await this.supabase
        .from('followers')
        .select('user_id')
        .eq('follower_id', followerId)
        .in('user_id', userIds);

      if (error) {
        throw error;
      }

      return new Set((data || []).map(f => f.user_id));
    } catch (err: any) {
      console.error('Failed to get follow status:', err);
      return new Set();
    }
  }

  /**
   * Track a tag as viewed by a user (add to usually_viewed_tags array)
   */
  async trackTagView(userId: string, tag: string): Promise<void> {
    if (!tag || !tag.trim()) {
      return;
    }

    const normalizedTag = tag.trim().toLowerCase();

    try {
      // Get current profile to check existing tags
      const { data: profile, error: selectError } = await this.supabase
        .from('user_profiles')
        .select('usually_viewed_tags')
        .eq('id', userId)
        .maybeSingle();

      if (selectError) {
        throw selectError;
      }

      const currentTags = (profile?.usually_viewed_tags || []) as string[];
      
      // Don't reorder - just add tag if it doesn't exist, keep existing order
      if (!currentTags.includes(normalizedTag)) {
        // Add to the end if not present, but limit to 10 total
        const updatedTags = [...currentTags, normalizedTag].slice(-10);
        
        // Update the profile
        const { error: updateError } = await this.supabase
          .from('user_profiles')
          .update({ usually_viewed_tags: updatedTags })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }

        // Update the current profile signal and cache if it's the current user's profile
        const currentProfile = this.currentProfile();
        if (currentProfile && currentProfile.id === userId) {
          const updatedProfile = { ...currentProfile, usually_viewed_tags: updatedTags };
          this.currentProfile.set(updatedProfile);
          // Update cache
          this.profileCache.set(userId, updatedProfile);
        } else {
          // If profile is not loaded, reload it to get updated tags (will use cache if available)
          try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (user && user.id === userId) {
              await this.getProfile(userId, true); // Force refresh to get updated tags
            }
          } catch (err) {
            console.warn('Could not reload profile after tracking tag:', err);
          }
        }
      }
      // If tag already exists, don't do anything - keep the order as is
    } catch (err: any) {
      console.error('Failed to track tag view:', err);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get profile with follow data (profile, isFollowing status, followers/following counts)
   */
  async getProfileWithFollowData(userId: string, currentUserId?: string): Promise<{
    profile: UserProfile | null;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
  }> {
    try {
      // Get all data in parallel for better performance
      const [profile, isFollowing, followersCount, followingCount] = await Promise.all([
        this.getProfile(userId),
        currentUserId ? this.isFollowing(userId, currentUserId) : Promise.resolve(false),
        this.getFollowersCount(userId),
        this.getFollowingCount(userId)
      ]);

      return {
        profile,
        isFollowing,
        followersCount,
        followingCount
      };
    } catch (err: any) {
      console.error('Failed to get profile with follow data:', err);
      throw err;
    }
  }

  /**
   * Get usually viewed tags for a user
   */
  async getUsuallyViewedTags(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('usually_viewed_tags')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data?.usually_viewed_tags || []) as string[];
    } catch (err: any) {
      console.error('Failed to get usually viewed tags:', err);
      return [];
    }
  }

  /**
   * Clear usually viewed tags for a user
   */
  async clearUsuallyViewedTags(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ usually_viewed_tags: [] })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update the current profile signal and cache if it's the current user's profile
      const currentProfile = this.currentProfile();
      if (currentProfile && currentProfile.id === userId) {
        const updatedProfile = { ...currentProfile, usually_viewed_tags: [] };
        this.currentProfile.set(updatedProfile);
        // Update cache
        this.profileCache.set(userId, updatedProfile);
      } else {
        // If profile is not loaded, reload it to get updated tags (will use cache if available)
        try {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (user && user.id === userId) {
            await this.getProfile(userId, true); // Force refresh to get updated tags
          }
        } catch (err) {
          console.warn('Could not reload profile after clearing tags:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to clear usually viewed tags:', err);
      throw err;
    }
  }
}

