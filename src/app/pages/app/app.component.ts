import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { Post } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { SearchFilters } from '../../shared/components/search-panel/search-panel.component';
import * as PostsActions from '../../core/store/posts/posts.actions';
import * as PostsSelectors from '../../core/store/posts/posts.selectors';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [CommonModule, FeedComponent, PostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppPageComponent {
  searchFilters = signal<SearchFilters>({ title: '', tags: [] });
  posts = signal<Post[]>([]);
  
  posts$!: Observable<Post[]>;
  isLoading$!: Observable<boolean>;

  filteredPosts = computed(() => {
    const posts = this.posts();
    const filters = this.searchFilters();
    
    if (!filters.title && filters.tags.length === 0) {
      return posts;
    }

    return posts.filter(post => {
      // Filter by title
      if (filters.title) {
        const titleMatch = post.description
          .toLowerCase()
          .includes(filters.title.toLowerCase());
        if (!titleMatch) return false;
      }

      // Filter by tags (mocked - check if any tag matches post tags)
      if (filters.tags.length > 0) {
        const postTags = post.tags || [];
        const hasMatchingTag = filters.tags.some(filterTag =>
          postTags.some(postTag => 
            postTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  });

  constructor(
    private store: Store,
    public authService: AuthService,
    private profileService: ProfileService
  ) {
    // Initialize observables
    this.posts$ = this.store.select(PostsSelectors.selectAllPosts);
    this.isLoading$ = this.store.select(PostsSelectors.selectPostsLoading);

    this.posts$.subscribe(posts => this.posts.set(posts));

    // Load posts when component initializes (only if not already loaded)
    this.loadPostsIfNeeded();
  }

  private loadPostsIfNeeded(): void {
    // Check if posts are already loaded to avoid unnecessary refreshes
    let postsLoaded = false;
    this.store.select(PostsSelectors.selectPostsLoaded).subscribe(loaded => {
      postsLoaded = loaded;
    }).unsubscribe();

    // Only load posts if they haven't been loaded yet
    if (!postsLoaded) {
      const user = this.authService.currentUser();
      if (user) {
        this.store.dispatch(PostsActions.loadPosts({
          limit: 50,
          tags: undefined,
          currentUserId: user.id
        }));
      }
    }
  }



  async onSearchChange(filters: SearchFilters): Promise<void> {
    this.searchFilters.set(filters);

    // Track tags when they're searched, but only if they're not already in usually viewed tags
    const user = this.authService.currentUser();
    if (user && filters.tags.length > 0) {
      // Get usually viewed tags from current profile signal (more efficient than API call)
      let usuallyViewedTags: string[] = [];
      const currentProfile = this.profileService.currentProfile();
      if (currentProfile && currentProfile.id === user.id && currentProfile.usually_viewed_tags) {
        usuallyViewedTags = currentProfile.usually_viewed_tags;
      } else {
        // Fallback to API call if profile not loaded
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

  deletePost(postId: string): void {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    this.store.dispatch(PostsActions.deletePost({ postId }));
  }
}
