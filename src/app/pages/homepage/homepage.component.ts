import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Wait for auth to initialize
    await this.authService.waitForInit();
    
    // If user is already logged in, redirect to app
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app']);
    }
  }
}


