import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  route: string;
  mock?: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
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
      { label: 'Home', route: '/app' },
      { label: 'Profile', route: profileRoute },
      { label: 'Follow', route: '/follow', mock: true },
      { label: 'Discover Junkies', route: '/discover', mock: true }
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
