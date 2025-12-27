import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTitleComponent } from '../../shared/components/app-title/app-title.component';
import { MenuComponent } from '../../shared/components/menu/menu.component';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { PostsService } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [CommonModule, AppTitleComponent, MenuComponent, FeedComponent, PostComponent],
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
}


