import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppTitleComponent } from '../../shared/components/app-title/app-title.component';
import { MenuComponent } from '../../shared/components/menu/menu.component';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { ProfileHeaderComponent } from '../../shared/components/profile-header/profile-header.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { PostsService, Post } from '../../core/services/posts.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTitleComponent, MenuComponent, FeedComponent, PostComponent, ProfileHeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileUserId: string | null = null;
  userPosts = signal<Post[]>([]);
  userPostsLoading = signal(false);
  newPostDescription = '';
  newPostNewsLink = '';
  newPostArchiveLink = '';
  showCreateForm = false;
  private routeSubscription?: Subscription;

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

  async createPost(): Promise<void> {
    if (!this.profileUserId || !this.isOwner) {
      return;
    }

    if (!this.newPostDescription.trim() || !this.newPostNewsLink.trim()) {
      alert('Please fill in description and news link');
      return;
    }

    // Validate URL format
    try {
      new URL(this.newPostNewsLink);
    } catch {
      alert('Please enter a valid news link URL');
      return;
    }

    if (this.newPostArchiveLink.trim()) {
      try {
        new URL(this.newPostArchiveLink);
      } catch {
        alert('Please enter a valid archive link URL');
        return;
      }
    }

    try {
      const newPost = await this.postsService.createPost(this.profileUserId, {
        description: this.newPostDescription.trim(),
        news_link: this.newPostNewsLink.trim(),
        archive_link: this.newPostArchiveLink.trim() || undefined
      });

      // Add the new post to the beginning of the user posts array
      this.userPosts.update(posts => [newPost, ...posts]);

      // Reset form
      this.newPostDescription = '';
      this.newPostNewsLink = '';
      this.newPostArchiveLink = '';
      this.showCreateForm = false;
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errorMessage = error?.message || error?.error?.message || 'Failed to create post. Please try again.';
      alert(errorMessage);
    }
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }
}

