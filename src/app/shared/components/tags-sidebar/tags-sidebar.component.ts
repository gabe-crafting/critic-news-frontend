import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { CreatePostDialogComponent, CreatePostDialogData } from '../create-post-dialog/create-post-dialog.component';
import { PostsService } from '../../../core/services/posts.service';

@Component({
  selector: 'app-tags-sidebar',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './tags-sidebar.component.html',
  styleUrl: './tags-sidebar.component.css'
})
export class TagsSidebarComponent implements OnInit {
  usuallyViewedTags = signal<string[]>([]);

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private postsService: PostsService,
    public profileService: ProfileService
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
}

