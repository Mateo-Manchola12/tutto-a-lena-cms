import type { Routes } from '@angular/router'
import { authGuard } from './guards/auth.guard'

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
]
