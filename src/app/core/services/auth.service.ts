import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { SupabaseService } from './supabase.service';
import { ProfileService } from './profile.service';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as ProfileActions from '../store/profile/profile.actions';
import * as PostsActions from '../store/posts/posts.actions';
import * as PostsSelectors from '../store/posts/posts.selectors';

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
    private router: Router,
    private store: Store,
    private profileService: ProfileService
  ) {
    this.initPromise = this.initAuth();
  }

  private async initAuth(): Promise<void> {
    // Get initial session (this will automatically handle email callback hash fragments)
    const { data: { session } } = await this.supabase.auth.getSession();
    this.session.set(session);
    this.currentUser.set(session?.user ?? null);

    // Load initial data if user is already signed in
    if (session?.user) {
      this.loadInitialData(session.user);
    }

    // Check if we have hash fragments from email callback and user is now authenticated
    if (session && typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('access_token')) {
        // Clear the hash from URL and redirect to app
        window.history.replaceState(null, '', window.location.pathname);
        this.router.navigate(['/app']);
      }
    }

    // Listen for auth changes (including email callbacks)
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);

      // Only load initial data on actual sign-in events, not on initial session detection
      if (session && event === 'SIGNED_IN') {
        // Load initial data for the newly signed-in user
        this.loadInitialData(session.user);

        // Check if we're coming from an email callback
        if (typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          if (hashParams.get('access_token')) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            // Only redirect if we're not already on a protected route
            const currentPath = window.location.pathname;
            if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
              this.router.navigate(['/app']);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        this.store.dispatch(ProfileActions.clearProfile());
        this.store.dispatch(PostsActions.clearPosts());
        this.profileService.clearCache();
      }
    });
  }

  async waitForInit(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Load initial data when user signs in
   */
  private loadInitialData(user: User): void {
    // Check if posts are already loaded to avoid unnecessary refetching
    let postsLoaded = false;
    this.store.select(PostsSelectors.selectPostsLoaded).subscribe(loaded => {
      postsLoaded = loaded;
    }).unsubscribe();

    // Only load posts if they haven't been loaded yet
    if (!postsLoaded) {
      this.store.dispatch(PostsActions.loadPosts({
        limit: 50,
        tags: undefined,
        currentUserId: user.id
      }));
    }
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
      // Check if there's an active session before attempting to sign out
      const currentSession = this.session();

      if (currentSession) {
        // Only call signOut if we have a valid session
        const { error } = await this.supabase.auth.signOut();

        if (error) {
          // If signOut fails, still clear local state and redirect
          console.warn('Sign out error (clearing local state anyway):', error);
        }
      }

      this.store.dispatch(ProfileActions.clearProfile());
      this.store.dispatch(PostsActions.clearPosts());
      this.profileService.clearCache();

      // Always clear local state and redirect, even if there was no session
      this.session.set(null);
      this.currentUser.set(null);
      this.router.navigate(['/']);
    } catch (err) {
      console.warn('Sign out error (clearing local state anyway):', err);
      this.store.dispatch(ProfileActions.clearProfile());
      this.store.dispatch(PostsActions.clearPosts());
      this.profileService.clearCache();
      this.session.set(null);
      this.currentUser.set(null);
      this.router.navigate(['/']);
    } finally {
      this.isLoading.set(false);
    }
  }

  isAuthenticated(): boolean {
    return this.session() !== null;
  }

}

