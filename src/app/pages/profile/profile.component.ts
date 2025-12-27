import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppTitleComponent } from '../../shared/components/app-title/app-title.component';
import { MenuComponent } from '../../shared/components/menu/menu.component';
import { FeedComponent } from '../../shared/components/feed/feed.component';
import { PostComponent } from '../../shared/components/post/post.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { PostsService, Post } from '../../core/services/posts.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTitleComponent, MenuComponent, FeedComponent, PostComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  isEditing = false;
  editedName = '';
  editedDescription = '';
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
      const profile = this.profileService.currentProfile();
      if (profile) {
        this.editedName = profile.name || '';
        this.editedDescription = profile.description || '';
      } else {
        // Initialize with empty values if no profile exists
        this.editedName = '';
        this.editedDescription = '';
      }
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

  startEditing(): void {
    const profile = this.profileService.currentProfile();
    this.editedName = profile?.name || '';
    this.editedDescription = profile?.description || '';
    this.isEditing = true;
  }

  cancelEditing(): void {
    const profile = this.profileService.currentProfile();
    this.editedName = profile?.name || '';
    this.editedDescription = profile?.description || '';
    this.isEditing = false;
  }

  async saveProfile(): Promise<void> {
    if (!this.profileUserId || !this.isOwner) {
      return;
    }

    try {
      await this.profileService.upsertProfile(this.profileUserId, {
        name: this.editedName.trim() || undefined,
        description: this.editedDescription.trim() || undefined
      });
      this.isEditing = false;
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }

  get displayName(): string {
    const profile = this.profileService.currentProfile();
    if (profile?.name) {
      return profile.name;
    }
    // If viewing own profile, try to get email from auth user
    if (this.isOwner) {
      const user = this.authService.currentUser();
      return user?.email?.split('@')[0] || 'User';
    }
    // For other users, return generic name if no profile name
    return 'User';
  }

  get displayDescription(): string {
    const profile = this.profileService.currentProfile();
    return profile?.description || 'Software developer passionate about building great user experiences. Always learning and sharing knowledge with the community.';
  }

  get profilePictureUrl(): string | null {
    const profile = this.profileService.currentProfile();
    return profile?.profile_picture_url || null;
  }

  get profileInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  async onFileSelected(event: Event): Promise<void> {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before resizing)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a smaller image.');
      return;
    }

    try {
      await this.profileService.uploadProfilePicture(this.profileUserId, file);
      // Reset file input
      input.value = '';
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  }

  async deleteProfilePicture(): Promise<void> {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      await this.profileService.deleteProfilePicture(this.profileUserId);
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      alert('Failed to delete profile picture. Please try again.');
    }
  }
}

