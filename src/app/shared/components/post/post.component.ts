import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { Post } from '../../../core/services/posts.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { EditPostDialogComponent, EditPostDialogData } from '../edit-post-dialog/edit-post-dialog.component';
import * as PostsActions from '../../../core/store/posts/posts.actions';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent implements OnInit {
  @Input() post!: Post;
  @Input() showDelete = false;
  @Input() showShare = true;
  @Output() onDelete = new EventEmitter<string>();
  @Output() onUpdate = new EventEmitter<Post>();

  isShared = signal(false);
  isSharing = signal(false);

  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    private dialog: MatDialog,
    private store: Store
  ) {}

  async ngOnInit(): Promise<void> {
    // Use share status from post data (fetched via join in database)
    this.isShared.set(this.post.is_shared_by_current_user || false);
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.post.user_id;
  }

  get canDelete(): boolean {
    return this.showDelete && this.isOwner;
  }

  get canEdit(): boolean {
    return this.isOwner && !this.post.shared_by; // Can't edit shared posts
  }

  get canShare(): boolean {
    const user = this.authService.currentUser();
    return !!user && !this.isOwner && this.showShare; // Can't share own posts
  }

  get isSharedPost(): boolean {
    return !!this.post.shared_by;
  }

  getUserName(): string {
    return this.post.user_profiles?.name || 'User';
  }

  getUserInitial(): string {
    const name = this.post.user_profiles?.name;
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return 'U';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  async copyNewsLink(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(this.post.news_link);
      // You could show a toast notification here if you have one
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.post.news_link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  }

  openEditDialog(): void {
    const dialogData: EditPostDialogData = {
      post: this.post
    };

    const dialogRef = this.dialog.open(EditPostDialogComponent, {
      data: dialogData,
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onUpdate.emit(result);
      }
    });
  }

  toggleShare(): void {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    // Use original_post_id if it's a shared post, otherwise use post.id
    const postIdToShare = this.post.original_post_id || this.post.id;

    this.isSharing.set(true);
    if (this.isShared()) {
      this.store.dispatch(PostsActions.unsharePost({ userId: user.id, postId: postIdToShare }));
      this.isShared.set(false);
    } else {
      this.store.dispatch(PostsActions.sharePost({ userId: user.id, postId: postIdToShare }));
      this.isShared.set(true);
    }
    // Store will update the post automatically via reducer
    this.onUpdate.emit(this.post);
    this.isSharing.set(false);
  }

  getSharedByUserName(): string {
    return this.post.shared_by?.name || 'User';
  }
}

