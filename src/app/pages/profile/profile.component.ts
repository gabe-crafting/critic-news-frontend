import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { ProfileHeaderComponent } from '../../shared/components/profile-header/profile-header.component';
import { SearchFilters } from '../../shared/components/search-panel/search-panel.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { PostsService } from '../../core/services/posts.service';
import * as ProfileActions from '../../core/store/profile/profile.actions';
import * as ProfileSelectors from '../../core/store/profile/profile.selectors';
import * as PostsActions from '../../core/store/posts/posts.actions';
import * as PostsSelectors from '../../core/store/posts/posts.selectors';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedComponent, PostComponent, ProfileHeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileUserId: string | null = null;
  searchFilters = signal<SearchFilters>({ title: '', tags: [] });
  private routeSubscription?: Subscription;

  currentProfile$!: Observable<any>;
  isFollowing$!: Observable<boolean>;
  followersCount$!: Observable<number>;
  followingCount$!: Observable<number>;
  profileLoading$!: Observable<boolean>;
  profileError$!: Observable<string | null>;
  userPosts$!: Observable<any[]>;
  userPostsLoading$!: Observable<boolean>;

  constructor(
    private store: Store,
    public authService: AuthService,
    public profileService: ProfileService,
    public postsService: PostsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentProfile$ = this.store.select(ProfileSelectors.selectCurrentProfile);
    this.isFollowing$ = this.store.select(ProfileSelectors.selectIsFollowing);
    this.followersCount$ = this.store.select(ProfileSelectors.selectFollowersCount);
    this.followingCount$ = this.store.select(ProfileSelectors.selectFollowingCount);
    this.profileLoading$ = this.store.select(ProfileSelectors.selectProfileLoading);
    this.profileError$ = this.store.select(ProfileSelectors.selectProfileError);
    this.userPosts$ = this.store.select(PostsSelectors.selectAllPosts);
    this.userPostsLoading$ = this.store.select(PostsSelectors.selectPostsLoading);

    // Watch for profile changes to update embedded profile data in posts
    this.currentProfile$.subscribe(profile => {
      // Profile update handling is now done in the post component
    });

  }

  ngOnInit(): void {
    // Get profile ID from route params
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.profileUserId = id;
        this.loadProfile(id);
      } else {
        // If no ID, redirect to current user's profile
        const user = this.authService.currentUser();
        if (user) {
          this.router.navigate(['/profile', user.id]);
        }
      }
    });

  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  loadProfile(userId: string): void {
    const currentUser = this.authService.currentUser();
    // Dispatch action to load profile with follow data
    this.store.dispatch(ProfileActions.loadProfileWithFollowData({
      userId,
      currentUserId: currentUser?.id
    }));

    // Load user posts
    this.loadUserPosts(userId);
  }

  loadUserPosts(userId: string): void {
    const currentUser = this.authService.currentUser();
    this.store.dispatch(PostsActions.loadPostsByUser({
      userId,
      limit: 50,
      currentUserId: currentUser?.id
    }));
  }

  async deletePost(postId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await this.postsService.deletePost(postId);
      // Reload posts to reflect the deletion
      if (this.profileUserId) {
        this.loadUserPosts(this.profileUserId);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  }


  async onSearchChange(filters: SearchFilters): Promise<void> {
    this.searchFilters.set(filters);

    // Track tags when they're searched, but only if they're not already in usually viewed tags
    const user = this.authService.currentUser();
    if (user && filters.tags.length > 0) {
      // Get usually viewed tags from current profile signal if it's the current user's profile
      let usuallyViewedTags: string[] = [];
      const currentProfile = this.profileService.currentProfile();
      if (currentProfile && currentProfile.id === user.id && currentProfile.usually_viewed_tags) {
        usuallyViewedTags = currentProfile.usually_viewed_tags;
      } else {
        // Fallback to API call if profile not loaded or not current user
        usuallyViewedTags = await this.profileService.getUsuallyViewedTags(user.id);
      }

      const usuallyViewedTagsLower = usuallyViewedTags.map(tag => tag.toLowerCase());

      // Track each tag that was searched but is not already in usually viewed tags
      for (const tag of filters.tags) {
        if (!usuallyViewedTagsLower.includes(tag.toLowerCase())) {
          await this.profileService.trackTagView(user.id, tag);
        }
      }
    }
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }
}

