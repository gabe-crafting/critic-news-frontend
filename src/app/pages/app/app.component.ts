import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AppTitleComponent } from '../../shared/components/app-title/app-title.component';
import { MenuComponent } from '../../shared/components/menu/menu.component';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { TagsSidebarComponent } from '../../shared/components/tags-sidebar/tags-sidebar.component';
import { UserInfoComponent } from '../../shared/components/user-info/user-info.component';
import { PostsService } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, AppTitleComponent, MenuComponent, FeedComponent, PostComponent, TagsSidebarComponent, UserInfoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppPageComponent implements OnInit {
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


