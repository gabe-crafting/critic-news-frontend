import { Component, Input, effect, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { EditProfileDialogComponent, EditProfileDialogData } from '../edit-profile-dialog/edit-profile-dialog.component';
import * as ProfileActions from '../../../core/store/profile/profile.actions';
import * as ProfileSelectors from '../../../core/store/profile/profile.selectors';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatCardModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css'
})
export class ProfileHeaderComponent implements OnChanges {
  @Input() profileUserId: string | null = null;

  currentProfile$!: Observable<any>;
  isFollowingUser$!: Observable<boolean>;
  followersCount$!: Observable<number>;
  followingCount$!: Observable<number>;
  profileLoading$!: Observable<boolean>;

  // Local signals for component-specific state
  isCheckingFollowStatus = signal<boolean>(false);

  constructor(
    private store: Store,
    public profileService: ProfileService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {
    this.currentProfile$ = this.store.select(ProfileSelectors.selectCurrentProfile);
    this.isFollowingUser$ = this.store.select(ProfileSelectors.selectIsFollowing);
    this.followersCount$ = this.store.select(ProfileSelectors.selectFollowersCount);
    this.followingCount$ = this.store.select(ProfileSelectors.selectFollowingCount);
    this.profileLoading$ = this.store.select(ProfileSelectors.selectProfileLoading);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // ProfileComponent is now responsible for loading profile data
    if (changes['profileUserId'] && this.profileUserId) {
      // Profile data should already be loaded by ProfileComponent
    }
  }

  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.id === this.profileUserId;
  }


  openEditDialog(): void {
    if (!this.profileUserId || !this.isOwner) {
      return;
    }

    let profile: any = null;
    this.currentProfile$.subscribe(p => profile = p).unsubscribe();

    const dialogData: EditProfileDialogData = {
      name: profile?.name || '',
      description: profile?.description || '',
      profileUserId: this.profileUserId
    };

    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      data: dialogData,
      width: '500px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Profile was saved successfully
        // The profile service will have already updated the profile
      }
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a smaller image.');
      return;
    }

    this.store.dispatch(ProfileActions.uploadProfilePicture({
      userId: this.profileUserId,
      file: file
    }));
    input.value = '';
  }

  deleteProfilePicture(): void {
    if (!this.isOwner || !this.profileUserId) {
      return;
    }

    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    this.store.dispatch(ProfileActions.deleteProfilePicture({
      userId: this.profileUserId
    }));
  }

  toggleFollow(): void {
    if (!this.profileUserId) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    if (this.isCheckingFollowStatus()) return;

    let isFollowing = false;
    this.isFollowingUser$.subscribe(following => isFollowing = following).unsubscribe();

    this.isCheckingFollowStatus.set(true);

    if (isFollowing) {
      this.store.dispatch(ProfileActions.unfollowUser({
        userId: this.profileUserId,
        followerId: currentUser.id
      }));
    } else {
      this.store.dispatch(ProfileActions.followUser({
        userId: this.profileUserId,
        followerId: currentUser.id
      }));
    }

    this.isCheckingFollowStatus.set(false);
  }
}

