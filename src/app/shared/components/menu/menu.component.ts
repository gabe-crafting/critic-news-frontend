import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserInfoComponent } from '../user-info/user-info.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, UserInfoComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(public authService: AuthService) {}

  get menuItems() {
    const user = this.authService.currentUser();
    const profileRoute = user ? `/profile/${user.id}` : '/app';
    
    return [
      { label: 'Home', route: '/app' },
      { label: 'Profile', route: profileRoute }
    ];
  }
}

