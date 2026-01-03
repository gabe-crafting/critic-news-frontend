import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/homepage/homepage.component').then(m => m.HomepageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [authGuard],
    loadChildren: () => import('./app.routes.auth').then(m => m.authRoutes)
  }
];
