import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ProfileService, UserProfile } from '../../core/services/profile.service';

@Component({
  selector: 'app-discover-junkies',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule],
  templateUrl: './discover-junkies.component.html',
  styleUrl: './discover-junkies.component.css'
})
export class DiscoverJunkiesComponent implements OnInit {
  profiles = signal<UserProfile[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(public profileService: ProfileService) {}

  async ngOnInit(): Promise<void> {
    await this.loadProfiles();
  }

  async loadProfiles(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const allProfiles = await this.profileService.getAllProfiles();
      this.profiles.set(allProfiles);
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
}

