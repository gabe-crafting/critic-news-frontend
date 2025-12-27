import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { AppPageComponent } from './pages/app/app.component';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent
  },
  {
    path: 'app',
    component: AppPageComponent
  }
];
