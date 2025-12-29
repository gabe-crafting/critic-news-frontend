import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { CreatePostDialogComponent, CreatePostDialogData } from '../create-post-dialog/create-post-dialog.component';
import { PostsService } from '../../../core/services/posts.service';

@Component({
  selector: 'app-tags-sidebar',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatCardModule, MatButtonModule],
  templateUrl: './tags-sidebar.component.html',
  styleUrl: './tags-sidebar.component.css'
})
export class TagsSidebarComponent {
  // Mock usually viewed tags
  usuallyViewedTags = [
    'Technology',
    'Politics',
    'Science',
    'Health',
    'Business',
    'Entertainment',
    'Sports',
    'Climate',
    'Education',
    'Culture'
  ];

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private postsService: PostsService
  ) {}

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

