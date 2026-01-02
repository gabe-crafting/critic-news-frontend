import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProfileState } from './profile.reducer';

export const selectProfileState = createFeatureSelector<ProfileState>('profile');

export const selectCurrentProfile = createSelector(
  selectProfileState,
  (state: ProfileState) => state.currentProfile
);

export const selectIsFollowing = createSelector(
  selectProfileState,
  (state: ProfileState) => state.isFollowing
);

export const selectFollowersCount = createSelector(
  selectProfileState,
  (state: ProfileState) => state.followersCount
);

export const selectFollowingCount = createSelector(
  selectProfileState,
  (state: ProfileState) => state.followingCount
);

export const selectProfileLoading = createSelector(
  selectProfileState,
  (state: ProfileState) => state.isLoading
);

export const selectProfileError = createSelector(
  selectProfileState,
  (state: ProfileState) => state.error
);

