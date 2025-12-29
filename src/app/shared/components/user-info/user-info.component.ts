import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.css'
})
export class UserInfoComponent {
  constructor(
    public authService: AuthService,
    public profileService: ProfileService
  ) {
    // Load profile when user changes
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.profileService.getProfile(user.id).catch(err => {
          // Profile might not exist yet, that's okay
        });
      }
    });
  }

  get profilePictureUrl(): string | null {
    return this.profileService.currentProfile()?.profile_picture_url || null;
  }

  get displayName(): string {
    const profile = this.profileService.currentProfile();
    if (profile?.name) {
      return profile.name;
    }
    return 'John Doe';
  }

  get profileInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  get profileRoute(): string {
    const user = this.authService.currentUser();
    return user ? `/profile/${user.id}` : '/app';
  }
}

