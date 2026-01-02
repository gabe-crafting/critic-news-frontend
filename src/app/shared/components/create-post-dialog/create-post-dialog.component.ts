import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ProfileService } from '../../../core/services/profile.service';
import { TagsInputComponent } from '../tags-input/tags-input.component';
import * as PostsActions from '../../../core/store/posts/posts.actions';
import * as PostsSelectors from '../../../core/store/posts/posts.selectors';

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
  isLoading$!: Observable<boolean>;

  constructor(
    public dialogRef: MatDialogRef<CreatePostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreatePostDialogData,
    private store: Store,
    private profileService: ProfileService
  ) {
    this.isLoading$ = this.store.select(PostsSelectors.selectPostsLoading);
  }

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

    this.store.dispatch(PostsActions.createPost({
      userId: this.data.userId,
      postData: {
        description: this.description.trim(),
        news_link: this.newsLink.trim(),
        tags: this.tags.length > 0 ? this.tags : undefined
      }
    }));
    this.dialogRef.close(true);
  }
}

