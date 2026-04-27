import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthSessionService } from './features/auth/data-access/auth-session.service';
import { UserRole } from './features/auth/data-access/auth-api.service';

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

const requireRole = (allowedRoles: UserRole[]): CanActivateFn => () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSession.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return allowedRoles.includes(authSession.role() as UserRole)
    ? true
    : router.createUrlTree(['/become-author']);
};

const requireAdmin: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSession.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  return authSession.role() === 'ADMIN'
    ? true
    : router.createUrlTree([authSession.getPostLoginRedirectUrl()]);
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
        path: 'admin/login',
        canActivate: [redirectAuthenticatedUsers],
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
        data: { mode: 'admin' },
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
        path: 'become-author',
        canActivate: [requireAuthentication],
        loadComponent: () =>
          import('./features/auth/pages/become-author-page/become-author-page.component').then(
            (m) => m.BecomeAuthorPageComponent,
          ),
      },
      {
        path: 'forgot-password',
        canActivate: [redirectAuthenticatedUsers],
        loadComponent: () =>
          import('./features/auth/pages/forgot-password-page/forgot-password-page.component').then(
            (m) => m.ForgotPasswordPageComponent,
          ),
      },
      {
        path: 'reset-password',
        canActivate: [redirectAuthenticatedUsers],
        loadComponent: () =>
          import('./features/auth/pages/forgot-password-page/forgot-password-page.component').then(
            (m) => m.ForgotPasswordPageComponent,
          ),
      },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
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
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
        loadComponent: () =>
          import('./features/author/pages/post-editor-page/post-editor-page.component').then(
            (m) => m.PostEditorPageComponent,
          ),
      },
      {
        path: 'write/:id',
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
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
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'dashboard/posts',
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
        data: {
          title: 'My Posts',
          description: 'A dedicated post management surface will live here so authors can filter, sort, and manage all of their drafts and published work.',
          nextStep: 'Connect this page to GET /posts plus author-specific filtering and add row actions for edit, publish, unpublish, and delete.',
        },
        loadComponent: () =>
          import('./features/dashboard/pages/my-posts-page/my-posts-page.component').then(
            (m) => m.MyPostsPageComponent,
          ),
      },
      {
        path: 'dashboard/analytics',
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
        data: {
          title: 'Analytics',
          description: 'This section is reserved for views, engagement, and performance summaries once the analytics payloads are ready.',
          nextStep: 'Feed this page from post metrics and engagement counts so each author can see story performance trends over time.',
        },
        loadComponent: () =>
          import('./features/dashboard/pages/analytics-page/analytics-page.component').then(
            (m) => m.AnalyticsPageComponent,
          ),
      },
      {
        path: 'dashboard/newsletter',
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
        data: {
          title: 'Newsletter',
          description: 'Newsletter management will sit here once subscription stats and sending flows are connected.',
          nextStep: 'Use the newsletter-service endpoints for subscriber growth, preferences, and campaign actions.',
        },
        loadComponent: () =>
          import('./features/dashboard/pages/newsletter-page/newsletter-page.component').then(
            (m) => m.NewsletterPageComponent,
          ),
      },
          {
            path: 'dashboard/earnings',
            canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
            loadComponent: () => import('./features/dashboard/pages/earnings-page/earnings-page.component').then(m => m.EarningsPageComponent)
          },
          {
            path: 'dashboard/subscribers',
            canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
            loadComponent: () => import('./features/dashboard/pages/subscribers-page/subscribers-page.component').then(m => m.SubscribersPageComponent)
          },
          {
            path: 'dashboard/drafts',
            canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
            loadComponent: () => import('./features/dashboard/pages/drafts-page/drafts-page.component').then(m => m.DraftsPageComponent)
          },
      {
        path: 'dashboard/topics',
        canActivate: [requireRole(['AUTHOR', 'ADMIN'])],
        data: {
          title: 'Topics',
          description: 'Topic and taxonomy management belongs here once categories and trending tags are fully connected to the author workflow.',
          nextStep: 'Use the category-service endpoints to show categories, tags, and trending topic suggestions in one place.',
        },
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-placeholder-page/dashboard-placeholder-page.component').then(
            (m) => m.DashboardPlaceholderPageComponent,
          ),
      },
    ],
  },
  {
    path: 'admin-server',
    canActivate: [requireAdmin],
    loadComponent: () =>
      import('./features/admin/pages/admin-dashboard-page/admin-dashboard-page.component').then(
        (m) => m.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'admin',
    redirectTo: 'admin-server',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
