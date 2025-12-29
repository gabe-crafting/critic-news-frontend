import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { AppPageComponent } from './pages/app/app.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { DiscoverJunkiesComponent } from './pages/discover-junkies/discover-junkies.component';
import { FollowingComponent } from './pages/following/following.component';
import { AppLayoutComponent } from './shared/layouts/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'app',
        component: AppPageComponent
      },
      {
        path: 'profile/:id',
        component: ProfileComponent
      },
      {
        path: 'profile',
        redirectTo: '/app',
        pathMatch: 'full'
      },
      {
        path: 'discover',
        component: DiscoverJunkiesComponent
      },
      {
        path: 'follow',
        component: FollowingComponent
      }
    ]
  }
];
