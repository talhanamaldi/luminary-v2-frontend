import { Routes } from '@angular/router';

import { authenticatedGuard, guestOnlyGuard, landingGuard } from './core/auth/auth.guards';
import { APP_PATHS } from './core/config/app-config';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [landingGuard],
    loadComponent: () => import('./shared/empty-route/empty-route').then((m) => m.EmptyRoute),
  },
  {
    path: APP_PATHS.login,
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
    title: 'Giriş | Luminary',
  },
  {
    path: APP_PATHS.invitationAccept,
    loadComponent: () =>
      import('./features/auth/invitation-accept-page/invitation-accept-page').then(
        (m) => m.InvitationAcceptPage,
      ),
    title: 'Daveti kabul et | Luminary',
  },
  {
    path: '',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./layout/authenticated-shell/authenticated-shell').then((m) => m.AuthenticatedShell),
    children: [
      {
        path: APP_PATHS.dashboard,
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
        title: 'Ana sayfa | Luminary',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
