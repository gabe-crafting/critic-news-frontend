import { createReducer, on } from '@ngrx/store';
import * as PostsActions from './posts.actions';
import { Post } from '../../services/posts.service';

export interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
}

export const initialState: PostsState = {
  posts: [],
  isLoading: false,
  error: null
};

export const postsReducer = createReducer(
  initialState,
  on(PostsActions.loadPosts, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(PostsActions.loadPostsSuccess, (state, { posts }) => ({
    ...state,
    posts,
    isLoading: false,
    error: null
  })),
  on(PostsActions.loadPostsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(PostsActions.loadPostsByUser, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(PostsActions.loadPostsByUserSuccess, (state, { posts }) => ({
    ...state,
    posts,
    isLoading: false,
    error: null
  })),
  on(PostsActions.loadPostsByUserFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(PostsActions.loadPostsFromFollowing, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(PostsActions.loadPostsFromFollowingSuccess, (state, { posts }) => ({
    ...state,
    posts,
    isLoading: false,
    error: null
  })),
  on(PostsActions.loadPostsFromFollowingFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(PostsActions.createPostSuccess, (state, { post }) => ({
    ...state,
    posts: [post, ...state.posts]
  })),
  on(PostsActions.updatePostSuccess, (state, { post }) => ({
    ...state,
    posts: state.posts.map(p => p.id === post.id ? post : p)
  })),
  on(PostsActions.deletePostSuccess, (state, { postId }) => ({
    ...state,
    posts: state.posts.filter(p => p.id !== postId)
  })),
  on(PostsActions.sharePostSuccess, (state, { userId, postId }) => ({
    ...state,
    posts: state.posts.map(post => {
      const idToCheck = post.original_post_id || post.id;
      if (idToCheck === postId) {
        return { ...post, is_shared_by_current_user: true };
      }
      return post;
    })
  })),
  on(PostsActions.unsharePostSuccess, (state, { userId, postId }) => ({
    ...state,
    posts: state.posts.map(post => {
      const idToCheck = post.original_post_id || post.id;
      if (idToCheck === postId) {
        return { ...post, is_shared_by_current_user: false };
      }
      return post;
    })
  })),
  on(PostsActions.clearPosts, (state) => ({
    ...state,
    posts: [],
    error: null
  }))
);

