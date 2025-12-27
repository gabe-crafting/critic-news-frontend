import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get supabase() {
    return this.supabaseService.client;
  }

  // Signals for reactive state management
  readonly currentUser = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  private initPromise: Promise<void>;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.initPromise = this.initAuth();
  }

  private async initAuth(): Promise<void> {
    // Get initial session
    const { data: { session } } = await this.supabase.auth.getSession();
    this.session.set(session);
    this.currentUser.set(session?.user ?? null);

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  async waitForInit(): Promise<void> {
    await this.initPromise;
  }

  async signUp(credentials: SignUpCredentials): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        this.session.set(data.session);
        this.currentUser.set(data.user);
      }
    } catch (err) {
      const authError = err as AuthError;
      this.error.set(authError.message || 'An error occurred during sign up');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signIn(credentials: SignInCredentials): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        this.session.set(data.session);
        this.currentUser.set(data.user);
      }
    } catch (err) {
      const authError = err as AuthError;
      this.error.set(authError.message || 'An error occurred during sign in');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw error;
      }

      this.session.set(null);
      this.currentUser.set(null);
      this.router.navigate(['/']);
    } catch (err) {
      const authError = err as AuthError;
      this.error.set(authError.message || 'An error occurred during sign out');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  isAuthenticated(): boolean {
    return this.session() !== null;
  }
}

