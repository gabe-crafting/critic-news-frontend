import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { postsReducer } from './core/store/posts/posts.reducer';
import { profileReducer } from './core/store/profile/profile.reducer';
import { PostsEffects } from './core/store/posts/posts.effects';
import { ProfileEffects } from './core/store/profile/profile.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideStore({
      posts: postsReducer,
      profile: profileReducer
    }),
    provideEffects([PostsEffects, ProfileEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ]
};
