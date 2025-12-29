import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Post } from '../../../core/services/posts.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { EditPostDialogComponent, EditPostDialogData } from '../edit-post-dialog/edit-post-dialog.component';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent {
  @Input() post!: Post;
  @Input() showDelete = false;
  @Output() onDelete = new EventEmitter<string>();
  @Output() onUpdate = new EventEmitter<Post>();

  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {}

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.post.user_id;
  }

  get canDelete(): boolean {
    return this.showDelete && this.isOwner;
  }

  get canEdit(): boolean {
    return this.isOwner;
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
}

