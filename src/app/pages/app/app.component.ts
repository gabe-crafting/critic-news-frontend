import { Component, computed, signal, effect } from '@angular/core';
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
    
    // Subscribe to posts from store
    this.posts$.subscribe(posts => this.posts.set(posts));
  }



  async onSearchChange(filters: SearchFilters): Promise<void> {
    this.searchFilters.set(filters);
    
    // Track tags when they're searched
    const user = this.authService.currentUser();
    if (user && filters.tags.length > 0) {
      // Track each tag that was searched
      for (const tag of filters.tags) {
        await this.profileService.trackTagView(user.id, tag);
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
