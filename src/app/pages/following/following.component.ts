import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { PostsService, Post } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { SearchFilters } from '../../shared/components/search-panel/search-panel.component';

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [CommonModule, FeedComponent, PostComponent],
  templateUrl: './following.component.html',
  styleUrl: './following.component.css'
})
export class FollowingComponent implements OnInit {
  followingPosts = signal<Post[]>([]);
  isLoadingPosts = signal<boolean>(false);
  searchFilters = signal<SearchFilters>({ title: '', tags: [] });

  filteredPosts = computed(() => {
    const posts = this.followingPosts();
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

      // Filter by tags
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
    public postsService: PostsService,
    public authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadFollowingPosts();
  }

  async loadFollowingPosts(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    this.isLoadingPosts.set(true);
    try {
      const posts = await this.postsService.getPostsFromFollowing(user.id);
      this.followingPosts.set(posts);
    } catch (error) {
      console.error('Failed to load following posts:', error);
      this.followingPosts.set([]);
    } finally {
      this.isLoadingPosts.set(false);
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

  async deletePost(postId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await this.postsService.deletePost(postId);
      // Remove from local array
      this.followingPosts.update(posts => posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  }

  onPostUpdate(updatedPost: Post): void {
    // Update the post in the local array
    this.followingPosts.update(posts =>
      posts.map(post => (post.id === updatedPost.id ? updatedPost : post))
    );
  }
}

