import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import * as ProfileSelectors from '../../../core/store/profile/profile.selectors';

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
    public profileService: ProfileService,
    private store: Store
  ) {
    // Load current user's profile when user changes
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        // Load the current user's profile specifically
        const currentProfile = this.profileService.currentProfile();
        // Only fetch if profile is not already loaded or if it's for a different user
        if (!currentProfile || currentProfile.id !== user.id) {
          this.profileService.getProfile(user.id).catch(err => {
            // Profile might not exist yet, that's okay
          });
        }
      }
    });
  }

  get profileRoute(): string {
    const user = this.authService.currentUser();
    return user ? `/profile/${user.id}` : '/app';
  }
}

