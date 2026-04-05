import type { Routes } from '@angular/router'
import { authGuard } from './guards/auth.guard'

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'contact-info',
        loadComponent: () => import('./pages/contact-info.page').then((m) => m.ContactInfoPage),
      },
      {
        path: 'social-media',
        loadComponent: () => import('./pages/social-media.page').then((m) => m.SocialMediaPage),
      },
      {
        path: 'menu',
        loadComponent: () => import('./pages/menu.page').then((m) => m.MenuPage),
      },
      {
        path: 'events',
        loadComponent: () => import('./pages/events.page').then((m) => m.EventsPage),
      },
      {
        path: 'gallery',
        loadComponent: () => import('./pages/gallery.page').then((m) => m.GalleryPage),
      },
      {
        path: '',
        redirectTo: 'contact-info',
        pathMatch: 'full',
      },
    ],
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
