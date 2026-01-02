import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PostsState } from './posts.reducer';

export const selectPostsState = createFeatureSelector<PostsState>('posts');

export const selectAllPosts = createSelector(
  selectPostsState,
  (state: PostsState) => state.posts
);

export const selectPostsLoading = createSelector(
  selectPostsState,
  (state: PostsState) => state.isLoading
);

export const selectPostsError = createSelector(
  selectPostsState,
  (state: PostsState) => state.error
);

