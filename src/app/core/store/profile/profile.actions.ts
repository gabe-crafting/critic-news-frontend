import { createAction, props } from '@ngrx/store';
import { UserProfile } from '../../services/profile.service';

export const loadProfile = createAction(
  '[Profile] Load Profile',
  props<{ userId: string }>()
);

export const loadProfileSuccess = createAction(
  '[Profile] Load Profile Success',
  props<{ profile: UserProfile | null }>()
);

export const loadProfileFailure = createAction(
  '[Profile] Load Profile Failure',
  props<{ error: string }>()
);

export const loadProfileWithFollowData = createAction(
  '[Profile] Load Profile With Follow Data',
  props<{ userId: string; currentUserId?: string }>()
);

export const loadProfileWithFollowDataSuccess = createAction(
  '[Profile] Load Profile With Follow Data Success',
  props<{
    profile: UserProfile | null;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
  }>()
);

export const loadProfileWithFollowDataFailure = createAction(
  '[Profile] Load Profile With Follow Data Failure',
  props<{ error: string }>()
);

export const updateProfile = createAction(
  '[Profile] Update Profile',
  props<{ userId: string; updates: any }>()
);

export const updateProfileSuccess = createAction(
  '[Profile] Update Profile Success',
  props<{ profile: UserProfile }>()
);

export const updateProfileFailure = createAction(
  '[Profile] Update Profile Failure',
  props<{ error: string }>()
);

export const followUser = createAction(
  '[Profile] Follow User',
  props<{ userId: string; followerId: string }>()
);

export const followUserSuccess = createAction(
  '[Profile] Follow User Success',
  props<{ userId: string; followerId: string }>()
);

export const followUserFailure = createAction(
  '[Profile] Follow User Failure',
  props<{ error: string }>()
);

export const unfollowUser = createAction(
  '[Profile] Unfollow User',
  props<{ userId: string; followerId: string }>()
);

export const unfollowUserSuccess = createAction(
  '[Profile] Unfollow User Success',
  props<{ userId: string; followerId: string }>()
);

export const unfollowUserFailure = createAction(
  '[Profile] Unfollow User Failure',
  props<{ error: string }>()
);

export const uploadProfilePicture = createAction(
  '[Profile] Upload Profile Picture',
  props<{ userId: string; file: File }>()
);

export const uploadProfilePictureSuccess = createAction(
  '[Profile] Upload Profile Picture Success',
  props<{ profile: UserProfile }>()
);

export const uploadProfilePictureFailure = createAction(
  '[Profile] Upload Profile Picture Failure',
  props<{ error: string }>()
);

export const deleteProfilePicture = createAction(
  '[Profile] Delete Profile Picture',
  props<{ userId: string }>()
);

export const deleteProfilePictureSuccess = createAction(
  '[Profile] Delete Profile Picture Success',
  props<{ profile: UserProfile }>()
);

export const deleteProfilePictureFailure = createAction(
  '[Profile] Delete Profile Picture Failure',
  props<{ error: string }>()
);

export const clearProfile = createAction('[Profile] Clear Profile');

