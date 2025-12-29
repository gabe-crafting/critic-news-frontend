import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ngOnInit(): Promise<void> {
    // Wait for auth to initialize
    await this.authService.waitForInit();
    
    // If user is already logged in, redirect to app
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.signIn({
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      });

      this.router.navigate(['/app']);
    } catch (error) {
      this.errorMessage.set(this.authService.error() || 'Failed to sign in');
    } finally {
      this.isLoading.set(false);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

