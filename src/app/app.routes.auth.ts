import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'app',
    loadComponent: () => import('./pages/app/app.component').then(m => m.AppPageComponent)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'profile',
    redirectTo: '/app',
    pathMatch: 'full'
  },
  {
    path: 'discover',
    loadComponent: () => import('./pages/discover-junkies/discover-junkies.component').then(m => m.DiscoverJunkiesComponent)
  },
  {
    path: 'following',
    loadComponent: () => import('./pages/following/following.component').then(m => m.FollowingComponent)
  },
  {
    path: '',
    redirectTo: '/app',
    pathMatch: 'full'
  }
];
