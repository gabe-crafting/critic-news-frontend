import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { SearchService } from '../../../core/services/search.service';
import { CreatePostDialogComponent, CreatePostDialogData } from '../create-post-dialog/create-post-dialog.component';
import { PostsService } from '../../../core/services/posts.service';

@Component({
  selector: 'app-tags-sidebar',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './tags-sidebar.component.html',
  styleUrl: './tags-sidebar.component.css'
})
export class TagsSidebarComponent implements OnInit, OnDestroy {
  usuallyViewedTags = signal<string[]>([]);
  selectedTags = signal<string[]>([]);
  private selectedTagsSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private postsService: PostsService,
    public profileService: ProfileService,
    private searchService: SearchService
  ) {
    // Watch for changes to the current profile's usually_viewed_tags
    effect(() => {
      const profile = this.profileService.currentProfile();
      const user = this.authService.currentUser();
      
      if (profile && user && profile.id === user.id && profile.usually_viewed_tags) {
        this.usuallyViewedTags.set(profile.usually_viewed_tags);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsuallyViewedTags();
    
    // Subscribe to selected tags to show visual indicator
    this.selectedTagsSubscription = this.searchService.selectedTags$.subscribe(tags => {
      this.selectedTags.set(tags);
    });
    
    // Initialize with current selected tags
    this.selectedTags.set(this.searchService.getSelectedTags());
  }

  ngOnDestroy(): void {
    this.selectedTagsSubscription?.unsubscribe();
  }

  async loadUsuallyViewedTags(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    try {
      const tags = await this.profileService.getUsuallyViewedTags(user.id);
      this.usuallyViewedTags.set(tags);
    } catch (error) {
      console.error('Failed to load usually viewed tags:', error);
    }
  }

  openCreatePostDialog(): void {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    // Check if user has a profile with a name
    const profile = this.profileService.currentProfile();
    if (!profile || !profile.name || !profile.name.trim()) {
      alert('You need to add a name to your profile before creating posts. Please edit your profile first.');
      return;
    }

    const dialogData: CreatePostDialogData = {
      userId: user.id
    };

    const dialogRef = this.dialog.open(CreatePostDialogComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh posts list
        this.postsService.getPosts().catch(error => {
          console.error('Failed to refresh posts:', error);
        });
      }
    });
  }

  async clearUsuallyViewedTags(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    if (!confirm('Are you sure you want to clear all usually viewed tags?')) {
      return;
    }

    try {
      await this.profileService.clearUsuallyViewedTags(user.id);
      this.usuallyViewedTags.set([]);
    } catch (error) {
      console.error('Failed to clear usually viewed tags:', error);
      alert('Failed to clear usually viewed tags. Please try again.');
    }
  }

  onTagClick(tag: string): void {
    // Trigger search for this tag (normalize to lowercase to match stored format)
    const normalizedTag = tag.toLowerCase();
    this.searchService.searchByTag(normalizedTag);
    
    // Track the tag view
    const user = this.authService.currentUser();
    if (user) {
      this.profileService.trackTagView(user.id, tag).catch(error => {
        console.error('Failed to track tag view:', error);
      });
    }
  }

  isTagSelected(tag: string): boolean {
    // Check if tag is selected (case-insensitive comparison)
    const normalizedTag = tag.toLowerCase();
    const selected = this.selectedTags().some(selectedTag => selectedTag.toLowerCase() === normalizedTag);
    return selected;
  }
}

