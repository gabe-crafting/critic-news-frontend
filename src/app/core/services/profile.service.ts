import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string | null;
  description: string | null;
  profile_picture_url: string | null;
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

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
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
          this.currentProfile.set(null);
          return null;
        }
        throw error;
      }

      this.currentProfile.set(data);
      return data;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch profile');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(userId: string, profile: { name?: string; description?: string }): Promise<UserProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(
          {
            id: userId,
            name: profile.name || null,
            description: profile.description || null
          },
          {
            onConflict: 'id'
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.currentProfile.set(data);
      return data;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to save profile');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: { name?: string; description?: string; profile_picture_url?: string }): Promise<UserProfile> {
    this.isLoading.set(true);
    this.error.set(null);

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

      this.currentProfile.set(data);
      return data;
    } catch (err: any) {
      this.error.set(err.message || 'Failed to update profile');
      throw err;
    } finally {
      this.isLoading.set(false);
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
   * @returns Public URL of uploaded image
   */
  async uploadProfilePicture(userId: string, file: File): Promise<string> {
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
      await this.updateProfile(userId, { profile_picture_url: urlData.publicUrl });

      return urlData.publicUrl;
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
  async deleteProfilePicture(userId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const profile = this.currentProfile();
      if (!profile?.profile_picture_url) {
        return;
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
      await this.updateProfile(userId, { profile_picture_url: undefined });
    } catch (err: any) {
      this.error.set(err.message || 'Failed to delete profile picture');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}

