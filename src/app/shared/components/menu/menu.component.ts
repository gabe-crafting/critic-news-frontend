import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  mock?: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(
    public authService: AuthService,
    public router: Router
  ) {}

  get menuItems(): MenuItem[] {
    const user = this.authService.currentUser();
    const profileRoute = user ? `/profile/${user.id}` : '/app';
    
    return [
      { label: 'Home', route: '/app', icon: 'home' },
      { label: 'Profile', route: profileRoute, icon: 'person' },
      { label: 'Following', route: '/following', icon: 'people' },
      { label: 'Discover Junkies', route: '/discover', icon: 'explore' }
    ];
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  onMockClick(label: string): void {
    // Mock functionality - for now just log
    console.log(`${label} clicked (mock)`);
  }

  async onLogout(): Promise<void> {
    await this.authService.signOut();
  }
}
