import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthSessionService } from './features/auth/data-access/auth-session.service';

const redirectAuthenticatedUsers: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isAuthenticated()
    ? router.createUrlTree([authSession.getPostLoginRedirectUrl()])
    : true;
};

const requireAuthentication: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/public-shell/public-shell.component').then(
        (m) => m.PublicShellComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page.component').then(
            (m) => m.HomePageComponent,
          ),
      },
      {
        path: 'feed',
        canActivate: [requireAuthentication],
        loadComponent: () =>
          import('./features/feed/pages/feed-page/feed-page.component').then(
            (m) => m.FeedPageComponent,
          ),
      },
      {
        path: 'blog/:id',
        loadComponent: () =>
          import('./features/posts/pages/post-detail-page/post-detail-page.component').then(
            (m) => m.PostDetailPageComponent,
          ),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./features/pricing/pages/pricing-page/pricing-page.component').then(
            (m) => m.PricingPageComponent,
          ),
      },
      {
        path: 'login',
        canActivate: [redirectAuthenticatedUsers],
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
      },
      {
        path: 'register',
        canActivate: [redirectAuthenticatedUsers],
        loadComponent: () =>
          import('./features/auth/pages/register-page/register-page.component').then(
            (m) => m.RegisterPageComponent,
          ),
      },
      {
        path: 'oauth2/redirect',
        loadComponent: () =>
          import('./features/auth/pages/oauth-redirect-page/oauth-redirect-page.component').then(
            (m) => m.OauthRedirectComponent,
          ),
      },
    ],
  },
  {
    path: '',
    canActivate: [requireAuthentication],
    loadComponent: () =>
      import('./core/layout/dashboard-shell/dashboard-shell.component').then(
        (m) => m.DashboardShellComponent,
      ),
    children: [
      {
        path: 'write',
        loadComponent: () =>
          import('./features/author/pages/post-editor-page/post-editor-page.component').then(
            (m) => m.PostEditorPageComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];