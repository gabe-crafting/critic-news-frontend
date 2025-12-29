import { Component, Input, effect, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { EditProfileDialogComponent, EditProfileDialogData } from '../edit-profile-dialog/edit-profile-dialog.component';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatCardModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css'
})
export class ProfileHeaderComponent implements OnChanges {
  @Input() profileUserId: string | null = null;

  isFollowingUser = signal<boolean>(false);
  followersCount = signal<number>(0);
  followingCount = signal<number>(0);
  isCheckingFollowStatus = signal<boolean>(false);


  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileUserId'] && this.profileUserId) {
      this.profileService.getProfile(this.profileUserId).catch(error => {
        console.error('Failed to load profile:', error);
      });
      this.loadFollowStatus();
      this.loadFollowCounts();
    }
  }

  async loadFollowStatus(): Promise<void> {
    if (!this.profileUserId) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser || currentUser.id === this.profileUserId) {
      this.isFollowingUser.set(false);
      return;
    }

    try {
      const following = await this.profileService.isFollowing(
        this.profileUserId,
        currentUser.id
      );
      this.isFollowingUser.set(following);
    } catch (error) {
      console.error('Failed to load follow status:', error);
    }
  }

  async loadFollowCounts(): Promise<void> {
    if (!this.profileUserId) return;

    try {
      const [followers, following] = await Promise.all([
        this.profileService.getFollowersCount(this.profileUserId),
        this.profileService.getFollowingCount(this.profileUserId)
      ]);
      this.followersCount.set(followers);
      this.followingCount.set(following);
    } catch (error) {
      console.error('Failed to load follow counts:', error);
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

  openEditDialog(): void {
    if (!this.profileUserId || !this.isOwner) {
      return;
    }

    const profile = this.profileService.currentProfile();
    const dialogData: EditProfileDialogData = {
      name: profile?.name || '',
      description: profile?.description || '',
      profileUserId: this.profileUserId
    };

    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      data: dialogData,
      width: '500px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Profile was saved successfully
        // The profile service will have already updated the profile
      }
    });
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

  async toggleFollow(): Promise<void> {
    if (!this.profileUserId) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    if (this.isCheckingFollowStatus()) return;

    this.isCheckingFollowStatus.set(true);

    try {
      if (this.isFollowingUser()) {
        await this.profileService.unfollowUser(this.profileUserId, currentUser.id);
        this.isFollowingUser.set(false);
        this.followersCount.update(count => Math.max(0, count - 1));
      } else {
        await this.profileService.followUser(this.profileUserId, currentUser.id);
        this.isFollowingUser.set(true);
        this.followersCount.update(count => count + 1);
      }
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
      alert(error.message || 'Failed to update follow status. Please try again.');
    } finally {
      this.isCheckingFollowStatus.set(false);
    }
  }
}

