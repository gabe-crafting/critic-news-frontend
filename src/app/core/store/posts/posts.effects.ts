import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import * as PostsActions from './posts.actions';
import { PostsService } from '../../services/posts.service';

@Injectable()
export class PostsEffects {
  private actions$ = inject(Actions);
  private postsService = inject(PostsService);

  loadPosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.loadPosts),
      switchMap(({ limit, tags, currentUserId }) =>
        from(this.postsService.getPosts(limit, tags, currentUserId)).pipe(
          map(posts => PostsActions.loadPostsSuccess({ posts })),
          catchError(error => of(PostsActions.loadPostsFailure({ error: error.message })))
        )
      )
    )
  );

  loadPostsByUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.loadPostsByUser),
      switchMap(({ userId, limit, currentUserId }) =>
        from(this.postsService.getPostsByUser(userId, limit, currentUserId)).pipe(
          map(posts => PostsActions.loadPostsByUserSuccess({ posts })),
          catchError(error => of(PostsActions.loadPostsByUserFailure({ error: error.message })))
        )
      )
    )
  );

  loadPostsFromFollowing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.loadPostsFromFollowing),
      switchMap(({ followerId, limit }) =>
        from(this.postsService.getPostsFromFollowing(followerId, limit)).pipe(
          map(posts => PostsActions.loadPostsFromFollowingSuccess({ posts })),
          catchError(error => of(PostsActions.loadPostsFromFollowingFailure({ error: error.message })))
        )
      )
    )
  );

  createPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.createPost),
      switchMap(({ userId, postData }) =>
        from(this.postsService.createPost(userId, postData)).pipe(
          map(post => PostsActions.createPostSuccess({ post })),
          catchError(error => of(PostsActions.createPostFailure({ error: error.message })))
        )
      )
    )
  );

  updatePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.updatePost),
      switchMap(({ postId, updates }) =>
        from(this.postsService.updatePost(postId, updates)).pipe(
          map(post => PostsActions.updatePostSuccess({ post })),
          catchError(error => of(PostsActions.updatePostFailure({ error: error.message })))
        )
      )
    )
  );

  deletePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.deletePost),
      switchMap(({ postId }) =>
        from(this.postsService.deletePost(postId)).pipe(
          map(() => PostsActions.deletePostSuccess({ postId })),
          catchError(error => of(PostsActions.deletePostFailure({ error: error.message })))
        )
      )
    )
  );

  sharePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.sharePost),
      switchMap(({ userId, postId }) =>
        from(this.postsService.sharePost(userId, postId)).pipe(
          map(() => PostsActions.sharePostSuccess({ userId, postId })),
          catchError(error => of(PostsActions.sharePostFailure({ error: error.message })))
        )
      )
    )
  );

  unsharePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostsActions.unsharePost),
      switchMap(({ userId, postId }) =>
        from(this.postsService.unsharePost(userId, postId)).pipe(
          map(() => PostsActions.unsharePostSuccess({ userId, postId })),
          catchError(error => of(PostsActions.unsharePostFailure({ error: error.message })))
        )
      )
    )
  );

}

