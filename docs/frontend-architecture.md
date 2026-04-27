# InkWell Frontend Architecture And Implementation Guide

This document defines a production-ready Angular frontend architecture for **InkWell**, a scalable microservices-based blogging platform backed by Spring Boot services behind an API Gateway.

It also maps the product requirements into implementable frontend slices so the team can move from feature ideas to route structure, services, state, and UI behavior without rewriting the plan later.

As of **April 19, 2026**, the latest actively supported Angular major is **v21** according to the official Angular release page:
- https://angular.dev/reference/releases

The recommendations below assume:
- Angular `v21`
- Standalone components and route-based lazy loading
- API Gateway as the single frontend entry point
- JWT auth with OAuth login support
- SSR/hydration enabled for public SEO-heavy pages

## Product Scope

InkWell supports four primary user states:
- Guest users can browse the home page, latest/trending blogs, search/filter results, and blog detail pages.
- Authenticated free users can write blogs, like posts, comment, subscribe to newsletters, and manage their profile.
- Pro users get premium capabilities such as media upload, richer analytics, and custom profile enhancements.
- Admin users handle moderation and platform operations if an admin panel is required later.

Core product journeys:
- `Guest -> Home -> Search/Filter -> Blog Detail -> Login Prompt`
- `Login/Register/OAuth -> Backend Auth -> Session Resolve -> Redirect to /feed`
- `Logged-in User -> Personalized Feed -> Read / Like / Comment / Write`
- `Creator -> Dashboard -> Analytics / Drafts / Publishing / Newsletter Growth`
- `Free User -> Pricing -> Upgrade -> Pro Features Enabled`

## 1. Architecture Principles

- Use **feature-first organization**, not type-first organization.
- Keep **core** for app-wide singleton concerns only.
- Keep **shared** for reusable presentational building blocks.
- Separate **public**, **reader**, **author**, and **admin** experiences.
- Prefer **standalone components**, `provideRouter`, `provideHttpClient`, and functional guards/interceptors.
- Use **SSR** for public content pages and progressive hydration for performance and SEO.
- Use **NgRx** only for truly global/cross-feature state. Keep ephemeral feature state local with signals/RxJS.
- Separate **identity/role** from **subscription entitlements**. A user can be an author on both Free and Pro plans.
- Support **day/night theming** from the start using design tokens, not page-level overrides.
- Model **public, authenticated, and premium-only capabilities** explicitly in routing and UI guards.

## 2. Recommended Stack

- Angular `v21`
- Angular Router with standalone lazy routes
- Angular HttpClient
- Angular SSR / hydration
- RxJS + Signals
- NgRx Store + Effects for auth, notifications, and admin analytics
- Angular CDK for overlays, menus, dialogs, a11y helpers
- Quill or TipTap wrapper for author editor
- `ngx-markdown` or backend-rendered sanitized HTML for published blog content
- a charting library such as `ng2-charts` or `ngx-echarts` for dashboard analytics
- Tailwind CSS or SCSS design tokens
- `NgOptimizedImage` for image performance

## 3. High-Level App Layers

### `core/`
App-singleton concerns:
- API config
- authentication/session services
- HTTP interceptors
- route guards
- error handling
- global layout shell
- theme service
- SEO/meta service
- analytics adapter

### `shared/`
Reusable UI and utilities:
- navbar, footer, buttons, cards, badges, avatar, modal, skeleton, pagination
- reusable pipes/directives
- generic types and UI helpers

### `features/`
Domain-oriented vertical slices:
- `auth`
- `home`
- `posts`
- `feed`
- `comments`
- `categories`
- `search`
- `notifications`
- `newsletter`
- `bookmarks`
- `profile`
- `pricing`
- `dashboard`
- `author`
- `admin`

## 4. Folder Structure

```text
src/
  app/
    app.config.ts
    app.component.ts
    app.routes.ts

    core/
      api/
        api.config.ts
        api-endpoints.ts
      auth/
        auth.facade.ts
        auth.service.ts
        auth.store.ts
        token.service.ts
        session.service.ts
      guards/
        auth.guard.ts
        role.guard.ts
        guest-only.guard.ts
      interceptors/
        auth.interceptor.ts
        error.interceptor.ts
        loading.interceptor.ts
      layout/
        app-shell.component.ts
        public-shell.component.ts
        dashboard-shell.component.ts
      seo/
        seo.service.ts
      theme/
        theme.service.ts
      state/
        app.state.ts
      models/
        api-response.model.ts
        page.model.ts
        user.model.ts
        auth.model.ts
      utils/
        storage.util.ts
        slug.util.ts

    shared/
      components/
        navbar/
        footer/
        theme-toggle/
        post-card/
        user-avatar/
        notification-bell/
        reading-progress/
        comment-item/
        confirm-modal/
        empty-state/
        loading-skeleton/
        newsletter-popup/
      directives/
        infinite-scroll.directive.ts
      pipes/
        safe-html.pipe.ts
        time-ago.pipe.ts
      ui/
        button/
        input/
        chip/
        modal/

    features/
      home/
        pages/
          home-page.component.ts
        data-access/
          home-feed.service.ts

      feed/
        pages/
          feed-page.component.ts
        data-access/
          feed.service.ts

      auth/
        pages/
          login-page.component.ts
          register-page.component.ts
          oauth-callback-page.component.ts
        components/
          auth-form.component.ts
          social-login-buttons.component.ts

      posts/
        pages/
          post-list-page.component.ts
          post-detail-page.component.ts
          post-search-page.component.ts
          post-category-page.component.ts
          tag-page.component.ts
        components/
          post-list.component.ts
          post-filters.component.ts
          post-meta.component.ts
        data-access/
          posts.service.ts
          posts.store.ts
        models/
          post.model.ts

      comments/
        components/
          comment-thread.component.ts
          comment-editor.component.ts
          reply-form.component.ts
        data-access/
          comments.service.ts

      notifications/
        pages/
          notifications-page.component.ts
        data-access/
          notifications.service.ts
          notifications.store.ts

      newsletter/
        components/
          newsletter-subscribe-form.component.ts
        data-access/
          newsletter.service.ts

      pricing/
        pages/
          pricing-page.component.ts
        data-access/
          billing.service.ts

      bookmarks/
        pages/
          bookmarks-page.component.ts
        data-access/
          bookmarks.service.ts

      profile/
        pages/
          profile-page.component.ts
          settings-page.component.ts
        data-access/
          profile.service.ts

      dashboard/
        pages/
          dashboard-page.component.ts
        components/
          analytics-summary.component.ts
          analytics-chart.component.ts
        data-access/
          dashboard.service.ts

      author/
        pages/
          author-dashboard-page.component.ts
          post-editor-page.component.ts
          my-posts-page.component.ts
          my-comments-page.component.ts
          analytics-page.component.ts
          media-library-page.component.ts
        components/
          editor-toolbar.component.ts
          media-uploader.component.ts
          analytics-cards.component.ts
        data-access/
          author-posts.service.ts
          media.service.ts
          author-analytics.service.ts

      admin/
        pages/
          admin-dashboard-page.component.ts
          users-page.component.ts
          categories-page.component.ts
          tags-page.component.ts
          moderation-page.component.ts
          admin-posts-page.component.ts
          analytics-page.component.ts
        components/
          user-table.component.ts
          moderation-queue.component.ts
        data-access/
          admin-users.service.ts
          admin-posts.service.ts
          admin-categories.service.ts
          admin-comments.service.ts
          admin-analytics.service.ts

    styles/
      _tokens.scss
      _themes.scss
      _mixins.scss

  environments/
    environment.ts
    environment.development.ts
```

## 5. Role Model

Use a clear role enum aligned with backend claims:

```ts
export type UserRole = 'READER' | 'AUTHOR' | 'ADMIN';
```

Keep subscription separate from role:

```ts
export type SubscriptionPlan = 'FREE' | 'PRO';

export interface FeatureEntitlements {
  canUploadImages: boolean;
  canViewAdvancedAnalytics: boolean;
  canUseCustomUsername: boolean;
  canAccessFutureAiFeatures: boolean;
}
```

Recommended access rules:
- Guest: public feed, post detail, search, category/tag pages
- Reader: likes, comments, replies, notifications, newsletter, bookmarks, follow authors, and basic blog writing
- Author: all Reader features + advanced publishing workflows, richer content management, and creator-focused analytics if your backend distinguishes authors explicitly
- Admin: moderation, user/role/category/tag/post management, system analytics
- Free plan: markdown writing, code blocks, basic analytics, newsletter subscription
- Pro plan: image upload, advanced analytics, custom username, premium feature flags

## 6. Routing Structure

Use route-level lazy loading with guards per area.

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestOnlyGuard } from './core/guards/guest-only.guard';
import { roleGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/public-shell.component').then(m => m.PublicShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/pages/home-page.component').then(m => m.HomePageComponent),
      },
      {
        path: 'feed',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/feed/pages/feed-page.component').then(m => m.FeedPageComponent),
      },
      {
        path: 'blogs',
        loadComponent: () =>
          import('./features/posts/pages/post-list-page.component').then(m => m.PostListPageComponent),
      },
      {
        path: 'blog/:id',
        loadComponent: () =>
          import('./features/posts/pages/post-detail-page.component').then(m => m.PostDetailPageComponent),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/posts/pages/post-search-page.component').then(m => m.PostSearchPageComponent),
      },
      {
        path: 'categories/:slug',
        loadComponent: () =>
          import('./features/posts/pages/post-category-page.component').then(m => m.PostCategoryPageComponent),
      },
      {
        path: 'tags/:slug',
        loadComponent: () =>
          import('./features/posts/pages/tag-page.component').then(m => m.TagPageComponent),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./features/pricing/pages/pricing-page.component').then(m => m.PricingPageComponent),
      },
      {
        path: 'login',
        canActivate: [guestOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/login-page.component').then(m => m.LoginPageComponent),
      },
      {
        path: 'register',
        canActivate: [guestOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/register-page.component').then(m => m.RegisterPageComponent),
      },
    ],
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/profile/pages/profile-page.component').then(m => m.ProfilePageComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/profile/pages/settings-page.component').then(m => m.SettingsPageComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notifications-page.component').then(m => m.NotificationsPageComponent),
      },
      {
        path: 'bookmarks',
        loadComponent: () =>
          import('./features/bookmarks/pages/bookmarks-page.component').then(m => m.BookmarksPageComponent),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page.component').then(m => m.DashboardPageComponent),
      },
    ],
  },
  {
    path: 'write',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/author/pages/post-editor-page.component').then(m => m.PostEditorPageComponent),
      },
    ],
  },
  {
    path: 'author',
    canActivate: [authGuard, roleGuard(['AUTHOR', 'ADMIN'])],
    loadComponent: () =>
      import('./core/layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/author/pages/author-dashboard-page.component').then(m => m.AuthorDashboardPageComponent),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/author/pages/my-posts-page.component').then(m => m.MyPostsPageComponent),
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () =>
          import('./features/author/pages/post-editor-page.component').then(m => m.PostEditorPageComponent),
      },
      {
        path: 'comments',
        loadComponent: () =>
          import('./features/author/pages/my-comments-page.component').then(m => m.MyCommentsPageComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/author/pages/analytics-page.component').then(m => m.AnalyticsPageComponent),
      },
      {
        path: 'media',
        loadComponent: () =>
          import('./features/author/pages/media-library-page.component').then(m => m.MediaLibraryPageComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./core/layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/pages/admin-dashboard-page.component').then(m => m.AdminDashboardPageComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/users-page.component').then(m => m.UsersPageComponent),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/admin/pages/admin-posts-page.component').then(m => m.AdminPostsPageComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/pages/categories-page.component').then(m => m.CategoriesPageComponent),
      },
      {
        path: 'tags',
        loadComponent: () =>
          import('./features/admin/pages/tags-page.component').then(m => m.TagsPageComponent),
      },
      {
        path: 'moderation',
        loadComponent: () =>
          import('./features/admin/pages/moderation-page.component').then(m => m.ModerationPageComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/admin/pages/analytics-page.component').then(m => m.AnalyticsPageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

Route intent summary:
- `/` -> public homepage with latest/trending content, search, categories, and primary CTA
- `/feed` -> personalized logged-in feed
- `/blog/:id` -> canonical blog detail route
- `/write` -> quick authoring entry point
- `/profile` -> user profile and settings area
- `/dashboard` -> analytics and creator summary
- `/pricing` -> plan comparison and upgrade flow

## 7. Key Components List

### Shared Layout / UI
- `NavbarComponent`
- `FooterComponent`
- `ThemeToggleComponent`
- `PostCardComponent`
- `NotificationBellComponent`
- `ReadingProgressComponent`
- `CommentItemComponent`
- `ConfirmModalComponent`
- `LoadingSkeletonComponent`
- `EmptyStateComponent`
- `NewsletterPopupComponent`

### Guest / Public
- `HomePageComponent`
- `PostListPageComponent`
- `PostDetailPageComponent`
- `PostSearchPageComponent`
- `PostFiltersComponent`
- `PricingPageComponent`

### Auth
- `LoginPageComponent`
- `RegisterPageComponent`
- `SocialLoginButtonsComponent`
- `OauthCallbackPageComponent`

### Reader
- `FeedPageComponent`
- `CommentThreadComponent`
- `ReplyFormComponent`
- `NotificationsPageComponent`
- `BookmarksPageComponent`
- `ProfilePageComponent`

### Author
- `AuthorDashboardPageComponent`
- `PostEditorPageComponent`
- `MediaUploaderComponent`
- `MyPostsPageComponent`
- `AnalyticsCardsComponent`

### Dashboard
- `DashboardPageComponent`
- `AnalyticsSummaryComponent`
- `AnalyticsChartComponent`

### Admin
- `AdminDashboardPageComponent`
- `UsersPageComponent`
- `UserTableComponent`
- `ModerationQueueComponent`
- `CategoriesPageComponent`
- `AdminPostsPageComponent`

## 8. API Gateway Strategy

The frontend should talk only to the API Gateway, not to individual microservices directly.

Example gateway mapping:
- `/api/auth/**` -> `auth-service`
- `/api/posts/**` -> `post-service`
- `/api/feed/**` -> `feed-service` or `post-service`
- `/api/comments/**` -> `comment-service`
- `/api/categories/**` -> `category-service`
- `/api/media/**` -> `media-service`
- `/api/newsletter/**` -> `newsletter-service`
- `/api/notifications/**` -> `notification-service`
- `/api/payments/**` -> `billing-service`
- `/api/analytics/**` -> `analytics-service`

Example environment config:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.inkwell.com',
};
```

## 9. Example Service

```ts
// features/posts/data-access/posts.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PostSummary {
  id: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  categoryName: string;
  authorName: string;
  publishedAt: string;
  readingTimeMinutes: number;
  likeCount: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface PostQuery {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  tag?: string;
  sort?: 'latest' | 'popular';
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/posts`;

  getPublishedPosts(query: PostQuery): Observable<PageResponse<PostSummary>> {
    let params = new HttpParams()
      .set('page', query.page ?? 0)
      .set('size', query.size ?? 10);

    if (query.search) params = params.set('search', query.search);
    if (query.category) params = params.set('category', query.category);
    if (query.tag) params = params.set('tag', query.tag);
    if (query.sort) params = params.set('sort', query.sort);

    return this.http.get<PageResponse<PostSummary>>(`${this.baseUrl}/published`, { params });
  }

  getPostById(postId: string) {
    return this.http.get(`${this.baseUrl}/${postId}`);
  }

  likePost(postId: string) {
    return this.http.post(`/api/blogs/${postId}/like`, {});
  }
}
```

## 10. Example Post Listing Component

This example uses standalone components, signals, and route query params for scalable filtering.

```ts
// features/posts/pages/post-list-page.component.ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PostsService, PostSummary } from '../data-access/posts.service';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-post-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PostCardComponent],
  template: `
    <section class="posts-page">
      <header class="posts-page__header">
        <h1>Latest stories</h1>
        <p>Discover fresh posts from the InkWell community.</p>
      </header>

      <div class="posts-page__toolbar">
        <button type="button" (click)="changeSort('latest')">Latest</button>
        <button type="button" (click)="changeSort('popular')">Popular</button>
      </div>

      <div *ngIf="loading()" class="posts-page__loading">Loading posts...</div>
      <div *ngIf="error()" class="posts-page__error">{{ error() }}</div>

      <div class="posts-page__grid" *ngIf="!loading()">
        <app-post-card
          *ngFor="let post of posts()"
          [post]="post">
        </app-post-card>
      </div>

      <button type="button" *ngIf="hasMore() && !loadingMore()" (click)="loadMore()">
        Load more
      </button>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListPageComponent {
  private readonly postsService = inject(PostsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly posts = signal<PostSummary[]>([]);
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.page.set(0);
        this.posts.set([]);
        this.hasMore.set(true);
        this.fetchPosts({
          page: 0,
          size: 12,
          search: params.get('q') ?? undefined,
          category: params.get('category') ?? undefined,
          tag: params.get('tag') ?? undefined,
          sort: (params.get('sort') as 'latest' | 'popular') ?? 'latest',
        });
      });
  }

  changeSort(sort: 'latest' | 'popular') {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort },
      queryParamsHandling: 'merge',
    });
  }

  loadMore() {
    const nextPage = this.page() + 1;
    this.fetchPosts({
      page: nextPage,
      size: 12,
      search: this.route.snapshot.queryParamMap.get('q') ?? undefined,
      category: this.route.snapshot.queryParamMap.get('category') ?? undefined,
      tag: this.route.snapshot.queryParamMap.get('tag') ?? undefined,
      sort: (this.route.snapshot.queryParamMap.get('sort') as 'latest' | 'popular') ?? 'latest',
    }, true);
  }

  private fetchPosts(query: {
    page: number;
    size: number;
    search?: string;
    category?: string;
    tag?: string;
    sort: 'latest' | 'popular';
  }, append = false) {
    this.error.set(null);
    append ? this.loadingMore.set(true) : this.loading.set(true);

    this.postsService
      .getPublishedPosts(query)
      .pipe(
        finalize(() => {
          append ? this.loadingMore.set(false) : this.loading.set(false);
        }),
      )
      .subscribe({
        next: response => {
          this.page.set(response.page);
          this.hasMore.set(!response.last);
          this.posts.set(append ? [...this.posts(), ...response.content] : response.content);
        },
        error: () => {
          this.error.set('Unable to load posts right now.');
        },
      });
  }
}
```

## 11. Auth Flow

### Recommended production approach

Prefer **HttpOnly secure cookies** for access/refresh tokens if your API Gateway and backend support it. This reduces XSS exposure because the token is not readable from JavaScript.

Recommended flow:
1. User logs in with email/password or chooses Google/GitHub.
2. Backend authenticates the user.
3. API Gateway/backend sets:
   - short-lived access token cookie
   - refresh token cookie
4. Frontend calls `/api/auth/me` to resolve the authenticated user and roles.
5. Angular stores only **derived session state** in memory/NgRx, not the raw JWT.
6. Interceptor sends requests with `withCredentials: true`.
7. On `401`, attempt refresh via `/api/auth/refresh`.
8. If refresh fails, clear state and redirect to `/login`.

### Fallback approach

If the backend cannot use HttpOnly cookies yet:
- keep access token in memory first
- use refresh token rotation
- avoid long-lived `localStorage` tokens when possible
- if persistence is unavoidable, use `sessionStorage` and strict CSP

## 12. Auth Interceptor Example

For cookie-based auth:

```ts
// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({
    withCredentials: true,
  });

  return next(apiReq);
};
```

For bearer-token fallback:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../auth/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }));
};
```

## 13. Role Guard Example

```ts
// core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    const user = authFacade.currentUser();

    if (user && allowedRoles.some(role => user.roles.includes(role))) {
      return true;
    }

    return router.createUrlTree(['/login']);
  };
};
```

## 14. State Management Guidance

Use a hybrid model:

### Keep local with Signals/RxJS
- post detail page state
- search filters
- editor draft state
- comment composer state
- modal visibility

### Keep global in NgRx
- authenticated user/session
- unread notification count
- theme preference
- admin analytics snapshot
- feature flags if needed

Recommended store slices:
- `auth`
- `notifications`
- `ui`
- optional `postsCache`

## 15. Comments Design

Support only **2-level threading** in the UI to stay readable and performant.

Model suggestion:
- top-level comments on post
- replies only to top-level comment
- flatten API response by thread group if needed

UI composition:
- `CommentThreadComponent`
- `CommentItemComponent`
- `ReplyFormComponent`

Important behaviors:
- optimistic posting for fast UX
- collapse long threads
- moderation/deleted states
- author/admin badges

Recommended endpoint mapping from the product brief:
- `POST /api/blogs/{id}/like`
- `POST /api/blogs/{id}/comments`
- `GET /api/blogs/{id}/comments`

Frontend integration guidance:
- disable like/comment actions for guests and open an auth CTA modal instead
- store comment submission state locally per thread
- reconcile optimistic likes/comments with server values on success
- surface moderation failures inline rather than as silent rollback

## 16. Security Recommendations

- Prefer HttpOnly secure cookies over storing JWT in browser storage.
- Enable CSRF protection if cookie auth is used.
- Sanitize rendered rich text using Angular sanitization and server-side content cleaning.
- Never bypass security with `bypassSecurityTrustHtml` for untrusted content.
- Validate role access both in frontend and backend.
- Enforce strict CSP headers.
- Use route guards only as UX protection, never as the only security layer.

## 17. Day/Night Theme Toggle

Implement the day/night switch centrally through a `ThemeService` in `core/theme/` and a reusable `ThemeToggleComponent` in `shared/components/theme-toggle/`.

Recommended behavior:
- support three modes: `light`, `dark`, and `system`
- read `prefers-color-scheme` on first load
- persist explicit user choice in `localStorage`
- apply theme through `data-theme` on `document.documentElement`
- keep all colors in CSS tokens so the same components work in both themes
- expose the current theme as a signal or store selector for fast UI updates

Suggested token structure:

```scss
:root {
  --bg: #f7f4ed;
  --surface: #fffdf8;
  --text: #1f1b16;
  --muted: #6a6157;
  --accent: #c96b2c;
  --border: #e5d9c8;
}

:root[data-theme='dark'] {
  --bg: #161411;
  --surface: #211d18;
  --text: #f3ede3;
  --muted: #c7b8a3;
  --accent: #ff9b54;
  --border: #3a332c;
}
```

Minimal Angular service shape:

```ts
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly stored = this.isBrowser
    ? (localStorage.getItem('theme') as ThemeMode | null)
    : null;

  readonly mode = signal<ThemeMode>(this.stored ?? 'system');
  readonly resolvedTheme = computed(() => {
    if (this.mode() !== 'system') return this.mode();
    if (!this.isBrowser) return 'light';

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  constructor() {
    effect(() => {
      const mode = this.mode();
      const resolved = this.resolvedTheme();

      this.document.documentElement.dataset.theme = resolved;

      if (!this.isBrowser) return;

      if (mode === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', mode);
      }
    });
  }

  setMode(mode: ThemeMode) {
    this.mode.set(mode);
  }

  toggle() {
    this.setMode(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }
}
```

Best placement:
- navbar for global access
- editor toolbar as a secondary access point if the writing interface is immersive
- settings page for explicit persistence control

Theme-specific UX notes:
- maintain accessible contrast in both modes
- avoid pure black backgrounds for long-form reading
- preserve syntax highlighting colors for code blocks in both themes
- verify charts, borders, focus rings, and empty states under dark mode

## 18. Performance Recommendations

- Lazy load all feature routes.
- SSR the public feed and post detail pages.
- Use `NgOptimizedImage` and responsive image URLs from media-service.
- Paginate or use infinite scroll for lists.
- Cache feed pages and post detail responses where useful.
- Preload likely-next routes for logged-in dashboards.
- Use skeleton loaders instead of blocking spinners.
- Split heavy editor dependencies into author-only chunks.

## 19. SEO & Accessibility

### SEO
- SSR home page, post detail, category, tag pages
- set dynamic title/meta/OG tags per post
- canonical URLs for post slugs
- generate sitemap from backend published-post feed
- use semantic headings and article markup

### Accessibility
- keyboard support for menus, dialogs, comment actions
- visible focus states
- `aria-label` on icon-only buttons
- proper contrast for dark mode
- screen-reader friendly unread count announcements

## 20. Feature Implementation Map

### Home Page (`/`)
- public feed with latest and trending sections
- search entry point with category/tag filters
- CTA buttons for `Login` and `Start Writing`
- SSR enabled for SEO and first contentful paint

### Feed Page (`/feed`)
- personalized recommendations based on follows, categories, or reading history
- suggested blogs and creators sidebar on desktop
- quick entry to `/write`

### Blog Detail (`/blog/:id`)
- content renderer for markdown/rich text output
- author bio and follow/subscribe area
- like and comment actions
- related blogs section
- guest interaction prompts when unauthenticated

### Write Page (`/write`)
- title input
- markdown or rich-text editor
- code block support
- autosave drafts locally and remotely
- publish / update flow
- Pro-only media upload gate

### Profile (`/profile`)
- avatar, bio, username, and social links
- published drafts and saved posts tabs
- edit profile and theme preference controls

### Dashboard (`/dashboard`)
- Free view: total views and peak traffic time
- Pro view: views over time, engagement rate, top-performing blogs
- newsletter growth metrics can be added here once backend support exists

### Pricing (`/pricing`)
- Free versus Pro comparison table
- upgrade CTA and payment status handling
- entitlement refresh after successful payment

### Newsletter
- `POST /api/newsletter/subscribe`
- support inline subscribe forms on home, blog detail, and profile pages
- show success state without forcing full-page navigation

## 21. UI/UX Direction

Target a clean editorial UI:
- generous whitespace
- strong typography hierarchy
- image-led post cards
- minimal chrome for reading pages
- sticky reading progress bar
- notification bell in navbar
- dark mode with system preference + manual toggle
- subtle tag/category chips

## 22. Bonus Features Placement

- Bookmarks: `features/bookmarks`
- Follow authors: `features/profile` or `features/social`
- Trending tags: `features/home`
- Newsletter popup: `shared/components/newsletter-popup`

## 23. Suggested Delivery Order

Build in this sequence:
1. App shell, routing, theme, environment config
2. Auth, guards, interceptor, session bootstrap
3. Public post feed + post detail + SEO
4. Personalized `/feed`, comments, likes, notifications, newsletter
5. `/write`, drafts, publish flow, Pro media upload gate
6. `/profile`, `/dashboard`, pricing, subscription refresh
7. Admin dashboard + moderation + user management
8. SSR optimization, caching, analytics depth, bookmarks/follows

## 24. Recommended First Scaffold

If you are starting from scratch, the first Angular setup should roughly include:
- standalone app config
- SSR enabled
- core/shared/features structure
- Tailwind or SCSS token system
- auth interceptor + guards
- public shell + dashboard shell
- home page + post list + post detail

## 25. Summary

For InkWell, the best frontend architecture is:
- **Angular v21**
- **standalone components**
- **feature-based structure**
- **API Gateway integration**
- **cookie-first auth with guards/interceptors**
- **separate role and plan entitlements**
- **NgRx only for shared global state**
- **SSR for public content**
- **theme-token based day/night toggle**
- **lazy-loaded author/admin sections**

This gives you a frontend that is maintainable for a small team today and still scales cleanly when the platform grows into a multi-role, multi-service production system.
