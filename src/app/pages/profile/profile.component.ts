import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { ProfileHeaderComponent } from '../../shared/components/profile-header/profile-header.component';
import { SearchFilters } from '../../shared/components/search-panel/search-panel.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { PostsService, Post } from '../../core/services/posts.service';
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
  userPosts = signal<Post[]>([]);
  userPostsLoading = signal(false);
  searchFilters = signal<SearchFilters>({ title: '', tags: [] });
  private routeSubscription?: Subscription;

  filteredPosts = computed(() => {
    const posts = this.userPosts();
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
    public authService: AuthService,
    public profileService: ProfileService,
    public postsService: PostsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Watch for new posts from the current user and add them to userPosts if viewing own profile
    effect(() => {
      const posts = this.postsService.posts();
      const currentUser = this.authService.currentUser();
      
      // Only update if viewing own profile and there are posts
      if (posts.length > 0 && currentUser && this.profileUserId && this.profileUserId === currentUser.id) {
        // Check if there's a new post from the current user that's not in userPosts
        const userPostsIds = new Set(this.userPosts().map(p => p.id));
        const newUserPosts = posts.filter(post => 
          post.user_id === currentUser.id && !userPostsIds.has(post.id)
        );
        
        if (newUserPosts.length > 0) {
          // Add new posts to the beginning of the array
          this.userPosts.update(existing => [...newUserPosts, ...existing]);
        }
      }
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

  async loadProfile(userId: string): Promise<void> {
    try {
      await this.profileService.getProfile(userId);
      // Load user posts
      await this.loadUserPosts(userId);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  async loadUserPosts(userId: string): Promise<void> {
    this.userPostsLoading.set(true);
    this.userPosts.set([]);
    try {
      const posts = await this.postsService.getPostsByUser(userId);
      this.userPosts.set(posts);
    } catch (error) {
      console.error('Failed to load user posts:', error);
      this.userPosts.set([]);
    } finally {
      this.userPostsLoading.set(false);
    }
  }

  async deletePost(postId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await this.postsService.deletePost(postId);
      // Remove from local array
      this.userPosts.update(posts => posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  }

  async onPostUpdate(updatedPost: Post): Promise<void> {
    // Reload posts if it's a share/unshare action to show the new shared post
    if (this.profileUserId) {
      await this.loadUserPosts(this.profileUserId);
    } else {
      // Otherwise just update the post in the local array
      this.userPosts.update(posts =>
        posts.map(post => (post.id === updatedPost.id ? updatedPost : post))
      );
    }
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

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }
}

