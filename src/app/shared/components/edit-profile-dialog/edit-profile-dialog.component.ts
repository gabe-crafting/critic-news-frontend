import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as ProfileActions from '../../../core/store/profile/profile.actions';
import * as ProfileSelectors from '../../../core/store/profile/profile.selectors';

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
  isLoading$: Observable<boolean>;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileDialogData,
    private store: Store
  ) {
    this.editedName = data.name || '';
    this.editedDescription = data.description || '';
    this.profileUserId = data.profileUserId;
    this.isLoading$ = this.store.select(ProfileSelectors.selectProfileLoading);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.profileUserId) {
      return;
    }

    this.store.dispatch(ProfileActions.updateProfile({
      userId: this.profileUserId,
      updates: {
        name: this.editedName.trim() || null,
        description: this.editedDescription.trim() || null
      }
    }));

    this.dialogRef.close(true);
  }
}

