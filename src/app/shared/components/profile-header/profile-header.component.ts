import { Component, Input, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css'
})
export class ProfileHeaderComponent implements OnChanges {
  @Input() profileUserId: string | null = null;

  isEditing = false;
  editedName = '';
  editedDescription = '';

  constructor(
    public profileService: ProfileService,
    public authService: AuthService
  ) {
    // Watch for profile changes and update edit form
    effect(() => {
      const profile = this.profileService.currentProfile();
      if (profile && !this.isEditing) {
        this.editedName = profile.name || '';
        this.editedDescription = profile.description || '';
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileUserId'] && this.profileUserId) {
      this.profileService.getProfile(this.profileUserId).catch(error => {
        console.error('Failed to load profile:', error);
      });
    }
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }

  get displayName(): string {
    const profile = this.profileService.currentProfile();
    if (profile?.name) {
      return profile.name;
    }
    if (this.isOwner) {
      const user = this.authService.currentUser();
      return user?.email?.split('@')[0] || 'User';
    }
    return 'User';
  }

  get displayDescription(): string {
    const profile = this.profileService.currentProfile();
    return profile?.description || 'Software developer passionate about building great user experiences. Always learning and sharing knowledge with the community.';
  }

  get profilePictureUrl(): string | null {
    const profile = this.profileService.currentProfile();
    return profile?.profile_picture_url || null;
  }

  get profileInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  startEditing(): void {
    const profile = this.profileService.currentProfile();
    this.editedName = profile?.name || '';
    this.editedDescription = profile?.description || '';
    this.isEditing = true;
  }

  cancelEditing(): void {
    const profile = this.profileService.currentProfile();
    this.editedName = profile?.name || '';
    this.editedDescription = profile?.description || '';
    this.isEditing = false;
  }

  async saveProfile(): Promise<void> {
    if (!this.profileUserId || !this.isOwner) {
      return;
    }

    try {
      await this.profileService.upsertProfile(this.profileUserId, {
        name: this.editedName.trim() || undefined,
        description: this.editedDescription.trim() || undefined
      });
      this.isEditing = false;
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a smaller image.');
      return;
    }

    try {
      await this.profileService.uploadProfilePicture(this.profileUserId, file);
      input.value = '';
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  }

  async deleteProfilePicture(): Promise<void> {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      await this.profileService.deleteProfilePicture(this.profileUserId);
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      alert('Failed to delete profile picture. Please try again.');
    }
  }
}

