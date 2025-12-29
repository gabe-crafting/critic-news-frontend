import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PostsService, Post, CreatePostData } from '../../../core/services/posts.service';
import { TagsInputComponent } from '../tags-input/tags-input.component';

export interface EditPostDialogData {
  post: Post;
}

@Component({
  selector: 'app-edit-post-dialog',
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
  templateUrl: './edit-post-dialog.component.html',
  styleUrl: './edit-post-dialog.component.css'
})
export class EditPostDialogComponent {
  description = '';
  newsLink = '';
  tags: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPostDialogData,
    public postsService: PostsService
  ) {
    // Initialize form with existing post data
    this.description = data.post.description;
    this.newsLink = data.post.news_link;
    this.tags = data.post.tags ? [...data.post.tags] : [];
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
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
      const updateData: Partial<CreatePostData> = {
        description: this.description.trim(),
        news_link: this.newsLink.trim(),
        tags: this.tags.length > 0 ? this.tags : undefined
      };

      const updatedPost = await this.postsService.updatePost(this.data.post.id, updateData);
      this.dialogRef.close(updatedPost);
    } catch (error: any) {
      console.error('Failed to update post:', error);
      const errorMessage = error?.message || error?.error?.message || 'Failed to update post. Please try again.';
      alert(errorMessage);
      // Dialog will remain open so user can retry
    }
  }
}


