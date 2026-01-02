import { createAction, props } from '@ngrx/store';
import { Post } from '../../services/posts.service';

export const loadPosts = createAction(
  '[Posts] Load Posts',
  props<{ limit?: number; tags?: string[]; currentUserId?: string }>()
);

export const loadPostsSuccess = createAction(
  '[Posts] Load Posts Success',
  props<{ posts: Post[] }>()
);

export const loadPostsFailure = createAction(
  '[Posts] Load Posts Failure',
  props<{ error: string }>()
);

export const loadPostsByUser = createAction(
  '[Posts] Load Posts By User',
  props<{ userId: string; limit?: number; currentUserId?: string }>()
);

export const loadPostsByUserSuccess = createAction(
  '[Posts] Load Posts By User Success',
  props<{ posts: Post[] }>()
);

export const loadPostsByUserFailure = createAction(
  '[Posts] Load Posts By User Failure',
  props<{ error: string }>()
);

export const loadPostsFromFollowing = createAction(
  '[Posts] Load Posts From Following',
  props<{ followerId: string; limit?: number }>()
);

export const loadPostsFromFollowingSuccess = createAction(
  '[Posts] Load Posts From Following Success',
  props<{ posts: Post[] }>()
);

export const loadPostsFromFollowingFailure = createAction(
  '[Posts] Load Posts From Following Failure',
  props<{ error: string }>()
);

export const createPost = createAction(
  '[Posts] Create Post',
  props<{ userId: string; postData: any }>()
);

export const createPostSuccess = createAction(
  '[Posts] Create Post Success',
  props<{ post: Post }>()
);

export const createPostFailure = createAction(
  '[Posts] Create Post Failure',
  props<{ error: string }>()
);

export const updatePost = createAction(
  '[Posts] Update Post',
  props<{ postId: string; updates: any }>()
);

export const updatePostSuccess = createAction(
  '[Posts] Update Post Success',
  props<{ post: Post }>()
);

export const updatePostFailure = createAction(
  '[Posts] Update Post Failure',
  props<{ error: string }>()
);

export const deletePost = createAction(
  '[Posts] Delete Post',
  props<{ postId: string }>()
);

export const deletePostSuccess = createAction(
  '[Posts] Delete Post Success',
  props<{ postId: string }>()
);

export const deletePostFailure = createAction(
  '[Posts] Delete Post Failure',
  props<{ error: string }>()
);

export const sharePost = createAction(
  '[Posts] Share Post',
  props<{ userId: string; postId: string }>()
);

export const sharePostSuccess = createAction(
  '[Posts] Share Post Success',
  props<{ userId: string; postId: string }>()
);

export const sharePostFailure = createAction(
  '[Posts] Share Post Failure',
  props<{ error: string }>()
);

export const unsharePost = createAction(
  '[Posts] Unshare Post',
  props<{ userId: string; postId: string }>()
);

export const unsharePostSuccess = createAction(
  '[Posts] Unshare Post Success',
  props<{ userId: string; postId: string }>()
);

export const unsharePostFailure = createAction(
  '[Posts] Unshare Post Failure',
  props<{ error: string }>()
);

export const clearPosts = createAction('[Posts] Clear Posts');

