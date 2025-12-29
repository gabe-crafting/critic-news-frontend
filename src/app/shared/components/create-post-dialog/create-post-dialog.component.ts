import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PostsService } from '../../../core/services/posts.service';
import { ProfileService } from '../../../core/services/profile.service';
import { TagsInputComponent } from '../tags-input/tags-input.component';

export interface CreatePostDialogData {
  userId: string;
}

@Component({
  selector: 'app-create-post-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    TagsInputComponent
  ],
  templateUrl: './create-post-dialog.component.html',
  styleUrl: './create-post-dialog.component.css'
})
export class CreatePostDialogComponent {
  description = '';
  newsLink = '';
  tags: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreatePostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreatePostDialogData,
    public postsService: PostsService,
    private profileService: ProfileService
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  async onPost(): Promise<void> {
    if (!this.data.userId) {
      return;
    }

    // Require profile name before allowing posts to avoid FK errors and anonymous junk
    const profile = this.profileService.currentProfile();
    if (!profile || !profile.name || !profile.name.trim()) {
      alert('You need to add a name to your profile before posting. Please edit your profile first.');
      this.dialogRef.close();
      return;
    }

    if (!this.description.trim() || !this.newsLink.trim()) {
      alert('Please fill in description and news link');
      return;
    }

    // Validate URL format
    try {
      new URL(this.newsLink);
    } catch {
      alert('Please enter a valid news link URL');
      return;
    }

    try {
      const newPost = await this.postsService.createPost(this.data.userId, {
        description: this.description.trim(),
        news_link: this.newsLink.trim(),
        tags: this.tags.length > 0 ? this.tags : undefined
      });
      this.dialogRef.close(newPost);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errorMessage = error?.message || error?.error?.message || 'Failed to create post. Please try again.';
      alert(errorMessage);
      // Dialog will remain open so user can retry
    }
  }
}

