import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProfileService } from '../../../core/services/profile.service';

export interface EditProfileDialogData {
  name: string;
  description: string;
  profileUserId: string;
}

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './edit-profile-dialog.component.html',
  styleUrl: './edit-profile-dialog.component.css'
})
export class EditProfileDialogComponent {
  editedName: string;
  editedDescription: string;
  profileUserId: string;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileDialogData,
    public profileService: ProfileService
  ) {
    this.editedName = data.name || '';
    this.editedDescription = data.description || '';
    this.profileUserId = data.profileUserId;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (!this.profileUserId) {
      return;
    }

    try {
      await this.profileService.upsertProfile(this.profileUserId, {
        name: this.editedName.trim() || undefined,
        description: this.editedDescription.trim() || undefined
      });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Dialog will remain open so user can retry
    }
  }
}

