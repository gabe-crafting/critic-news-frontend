import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
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
    if (this.signupForm.invalid) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.signUp({
        email: this.signupForm.value.email,
        password: this.signupForm.value.password
      });

      // Navigate to app or show success message
      this.router.navigate(['/app']);
    } catch (error) {
      this.errorMessage.set(this.authService.error() || 'Failed to sign up');
    } finally {
      this.isLoading.set(false);
    }
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  get passwordMismatch(): boolean {
    return (
      this.signupForm.errors?.['passwordMismatch'] &&
      this.confirmPassword?.touched &&
      this.confirmPassword?.dirty
    );
  }
}

