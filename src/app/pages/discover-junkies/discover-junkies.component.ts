import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

interface ProfileWithFollowStatus extends UserProfile {
  isFollowing: boolean;
  isUpdatingFollow: boolean;
  followersCount: number;
  followingCount: number;
}

@Component({
  selector: 'app-discover-junkies',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule],
  templateUrl: './discover-junkies.component.html',
  styleUrl: './discover-junkies.component.css'
})
export class DiscoverJunkiesComponent implements OnInit {
  profiles = signal<ProfileWithFollowStatus[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    public profileService: ProfileService,
    public authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProfiles();
  }

  async loadProfiles(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const currentUser = this.authService.currentUser();
      const allProfiles = await this.profileService.getAllProfiles();

      // Filter out current user's own profile
      const otherProfiles = currentUser
        ? allProfiles.filter(profile => profile.id !== currentUser.id)
        : allProfiles;

      // Get follow status for all profiles
      let followStatusSet = new Set<string>();
      if (currentUser && otherProfiles.length > 0) {
        const userIds = otherProfiles.map(p => p.id);
        followStatusSet = await this.profileService.getFollowStatusForUsers(
          userIds,
          currentUser.id
        );
      }

      // Load follower/following counts for all profiles
      const profilesWithStatus: ProfileWithFollowStatus[] = await Promise.all(
        otherProfiles.map(async profile => {
          const [followers, following] = await Promise.all([
            this.profileService.getFollowersCount(profile.id),
            this.profileService.getFollowingCount(profile.id)
          ]);
          return {
            ...profile,
            isFollowing: followStatusSet.has(profile.id),
            isUpdatingFollow: false,
            followersCount: followers,
            followingCount: following
          };
        })
      );

      // Sort: followed users first, then others
      profilesWithStatus.sort((a, b) => {
        if (a.isFollowing && !b.isFollowing) return -1;
        if (!a.isFollowing && b.isFollowing) return 1;
        return 0;
      });

      this.profiles.set(profilesWithStatus);
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load profiles');
      console.error('Failed to load profiles:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getUserInitial(profile: UserProfile): string {
    const name = profile.name;
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getUserName(profile: UserProfile): string {
    return profile.name || 'User';
  }

  async toggleFollow(profile: ProfileWithFollowStatus): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser || profile.isUpdatingFollow) {
      return;
    }

    // Don't allow following yourself
    if (profile.id === currentUser.id) {
      return;
    }

    // Set updating state
    this.profiles.update(profiles =>
      profiles.map(p => (p.id === profile.id ? { ...p, isUpdatingFollow: true } : p))
    );

    try {
      const newFollowStatus = !profile.isFollowing;
      
      if (profile.isFollowing) {
        await this.profileService.unfollowUser(profile.id, currentUser.id);
      } else {
        await this.profileService.followUser(profile.id, currentUser.id);
      }

      // Update follow status first
      this.profiles.update(profiles => {
        const updated = profiles.map(p =>
          p.id === profile.id ? { ...p, isFollowing: newFollowStatus, isUpdatingFollow: false } : p
        );
        // Re-sort to maintain followed-first order
        return updated.sort((a, b) => {
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;
          return 0;
        });
      });

      // Refresh counts for the updated profile
      const [followers, following] = await Promise.all([
        this.profileService.getFollowersCount(profile.id),
        this.profileService.getFollowingCount(profile.id)
      ]);

      // Update counts
      this.profiles.update(profiles =>
        profiles.map(p =>
          p.id === profile.id
            ? { ...p, followersCount: followers, followingCount: following }
            : p
        )
      );
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
      alert(error.message || 'Failed to update follow status. Please try again.');
      // Reset updating state on error
      this.profiles.update(profiles =>
        profiles.map(p => (p.id === profile.id ? { ...p, isUpdatingFollow: false } : p))
      );
    }
  }
}

