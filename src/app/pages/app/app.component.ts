import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppPageComponent {
  constructor(public authService: AuthService) {}

  async onLogout(): Promise<void> {
    await this.authService.signOut();
  }
}


