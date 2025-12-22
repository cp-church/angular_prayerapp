import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { siteAuthGuard } from './guards/site-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [siteAuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [siteAuthGuard, adminGuard],
    data: { preload: true } // Hint for preloading strategy if implemented
  },
  {
    path: 'presentation',
    loadComponent: () => import('./pages/presentation/presentation.component').then(m => m.PresentationComponent),
    canActivate: [siteAuthGuard],
    data: { preload: false }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
