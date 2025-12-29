import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { PostsService, Post } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';
import { SearchFilters } from '../../shared/components/search-panel/search-panel.component';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [CommonModule, FeedComponent, PostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppPageComponent implements OnInit {
  searchFilters = signal<SearchFilters>({ title: '', tags: [] });

  filteredPosts = computed(() => {
    const posts = this.postsService.posts();
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
    public postsService: PostsService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    try {
      await this.postsService.getPosts();
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  onSearchChange(filters: SearchFilters): void {
    this.searchFilters.set(filters);
  }

  async deletePost(postId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await this.postsService.deletePost(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  }

  onPostUpdate(updatedPost: any): void {
    // The posts service already updates the signal, so this is just for consistency
    // The signal will automatically trigger a re-render
  }
}


