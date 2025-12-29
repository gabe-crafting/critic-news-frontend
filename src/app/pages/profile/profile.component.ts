import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
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
  ) {}

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

  onPostUpdate(updatedPost: Post): void {
    // Update the post in the local array
    this.userPosts.update(posts =>
      posts.map(post => (post.id === updatedPost.id ? updatedPost : post))
    );
  }

  onSearchChange(filters: SearchFilters): void {
    this.searchFilters.set(filters);
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }
}

