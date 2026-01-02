import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import * as ProfileActions from './profile.actions';
import { ProfileService } from '../../services/profile.service';

@Injectable()
export class ProfileEffects {
  private actions$ = inject(Actions);
  private profileService = inject(ProfileService);

  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadProfile),
      switchMap(({ userId }) =>
        from(this.profileService.getProfile(userId)).pipe(
          map(profile => ProfileActions.loadProfileSuccess({ profile })),
          catchError(error => of(ProfileActions.loadProfileFailure({ error: error.message })))
        )
      )
    )
  );

  loadProfileWithFollowData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadProfileWithFollowData),
      switchMap(({ userId, currentUserId }) =>
        from(this.profileService.getProfileWithFollowData(userId, currentUserId)).pipe(
          map(({ profile, isFollowing, followersCount, followingCount }) =>
            ProfileActions.loadProfileWithFollowDataSuccess({ profile, isFollowing, followersCount, followingCount })
          ),
          catchError(error => of(ProfileActions.loadProfileWithFollowDataFailure({ error: error.message })))
        )
      )
    )
  );

  followUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.followUser),
      switchMap(({ userId, followerId }) =>
        from(this.profileService.followUser(userId, followerId)).pipe(
          map(() => ProfileActions.followUserSuccess({ userId, followerId })),
          catchError(error => of(ProfileActions.followUserFailure({ error: error.message })))
        )
      )
    )
  );

  unfollowUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.unfollowUser),
      switchMap(({ userId, followerId }) =>
        from(this.profileService.unfollowUser(userId, followerId)).pipe(
          map(() => ProfileActions.unfollowUserSuccess({ userId, followerId })),
          catchError(error => of(ProfileActions.unfollowUserFailure({ error: error.message })))
        )
      )
    )
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.updateProfile),
      switchMap(({ userId, updates }) =>
        from(this.profileService.updateProfile(userId, updates)).pipe(
          map(profile => {
            // Clear cache for this user to ensure fresh data on next load
            this.profileService.clearCache();
            return ProfileActions.updateProfileSuccess({ profile });
          }),
          catchError(error => of(ProfileActions.updateProfileFailure({ error: error.message })))
        )
      )
    )
  );

  uploadProfilePicture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.uploadProfilePicture),
      switchMap(({ userId, file }) =>
        from(this.profileService.uploadProfilePicture(userId, file)).pipe(
          map(profile => {
            // Clear cache for this user to ensure fresh data on next load
            this.profileService.clearCache();
            return ProfileActions.uploadProfilePictureSuccess({ profile });
          }),
          catchError(error => of(ProfileActions.uploadProfilePictureFailure({ error: error.message })))
        )
      )
    )
  );

  deleteProfilePicture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.deleteProfilePicture),
      switchMap(({ userId }) =>
        from(this.profileService.deleteProfilePicture(userId)).pipe(
          map(profile => {
            // Clear cache for this user to ensure fresh data on next load
            this.profileService.clearCache();
            return ProfileActions.deleteProfilePictureSuccess({ profile });
          }),
          catchError(error => of(ProfileActions.deleteProfilePictureFailure({ error: error.message })))
        )
      )
    )
  );

}

