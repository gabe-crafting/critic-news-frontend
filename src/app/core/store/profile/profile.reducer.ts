import { createReducer, on } from '@ngrx/store';
import * as ProfileActions from './profile.actions';
import { UserProfile } from '../../services/profile.service';

export interface ProfileState {
  currentProfile: UserProfile | null;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  isLoading: boolean;
  error: string | null;
}

export const initialState: ProfileState = {
  currentProfile: null,
  isFollowing: false,
  followersCount: 0,
  followingCount: 0,
  isLoading: false,
  error: null
};

export const profileReducer = createReducer(
  initialState,
  on(ProfileActions.loadProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(ProfileActions.loadProfileSuccess, (state, { profile }) => ({
    ...state,
    currentProfile: profile,
    isLoading: false,
    error: null
  })),
  on(ProfileActions.loadProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.loadProfileWithFollowData, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(ProfileActions.loadProfileWithFollowDataSuccess, (state, { profile, isFollowing, followersCount, followingCount }) => ({
    ...state,
    currentProfile: profile,
    isFollowing,
    followersCount,
    followingCount,
    isLoading: false,
    error: null
  })),
  on(ProfileActions.loadProfileWithFollowDataFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.followUser, (state) => ({
    ...state,
    isLoading: true
  })),
  on(ProfileActions.followUserSuccess, (state) => ({
    ...state,
    isFollowing: true,
    followersCount: state.followersCount + 1,
    isLoading: false
  })),
  on(ProfileActions.followUserFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.unfollowUser, (state) => ({
    ...state,
    isLoading: true
  })),
  on(ProfileActions.unfollowUserSuccess, (state) => ({
    ...state,
    isFollowing: false,
    followersCount: Math.max(0, state.followersCount - 1),
    isLoading: false
  })),
  on(ProfileActions.unfollowUserFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.updateProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(ProfileActions.updateProfileSuccess, (state, { profile }) => ({
    ...state,
    currentProfile: profile,
    isLoading: false,
    error: null
  })),
  on(ProfileActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.uploadProfilePicture, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(ProfileActions.uploadProfilePictureSuccess, (state, { profile }) => ({
    ...state,
    currentProfile: profile,
    isLoading: false,
    error: null
  })),
  on(ProfileActions.uploadProfilePictureFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.deleteProfilePicture, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(ProfileActions.deleteProfilePictureSuccess, (state, { profile }) => ({
    ...state,
    currentProfile: profile,
    isLoading: false,
    error: null
  })),
  on(ProfileActions.deleteProfilePictureFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(ProfileActions.clearProfile, (state) => ({
    ...state,
    currentProfile: null,
    isFollowing: false,
    followersCount: 0,
    followingCount: 0,
    error: null
  }))
);

