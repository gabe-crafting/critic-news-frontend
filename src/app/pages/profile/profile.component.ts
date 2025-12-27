import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppTitleComponent } from '../../shared/components/app-title/app-title.component';
import { MenuComponent } from '../../shared/components/menu/menu.component';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTitleComponent, MenuComponent, FeedComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  isEditing = false;
  editedName = '';
  editedDescription = '';
  profileUserId: string | null = null;
  private routeSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    public profileService: ProfileService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get profile ID from route params
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.profileUserId = id;
        this.loadProfile(id);
      } else {
        // If no ID, redirect to current user's profile
        const user = this.authService.currentUser();
        if (user) {
          this.router.navigate(['/profile', user.id]);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  async loadProfile(userId: string): Promise<void> {
    try {
      await this.profileService.getProfile(userId);
      const profile = this.profileService.currentProfile();
      if (profile) {
        this.editedName = profile.name || '';
        this.editedDescription = profile.description || '';
      } else {
        // Initialize with empty values if no profile exists
        this.editedName = '';
        this.editedDescription = '';
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
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

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }

  get displayName(): string {
    const profile = this.profileService.currentProfile();
    if (profile?.name) {
      return profile.name;
    }
    // If viewing own profile, try to get email from auth user
    if (this.isOwner) {
      const user = this.authService.currentUser();
      return user?.email?.split('@')[0] || 'User';
    }
    // For other users, return generic name if no profile name
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

  async onFileSelected(event: Event): Promise<void> {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before resizing)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a smaller image.');
      return;
    }

    try {
      await this.profileService.uploadProfilePicture(this.profileUserId, file);
      // Reset file input
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

