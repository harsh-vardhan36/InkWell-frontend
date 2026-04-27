import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService, AuthUser, UserRole } from '../../../auth/data-access/auth-api.service';

type AdminUserFilter = 'ALL' | 'PRO' | 'FREE' | 'READER' | 'AUTHOR' | 'ADMIN';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="admin-page">
      <header class="admin-hero">
        <div class="admin-hero__copy">
          <p class="admin-hero__eyebrow">Admin Server</p>
          <h1>User control room for InkWell</h1>
          <p>Review plans, watch role distribution, and move members between reader, author, and admin access from one secure console.</p>
        </div>

        <div class="admin-hero__stats">
          <button type="button" class="stat-chip" (click)="setFilter('ALL')" [class.is-active]="activeFilter() === 'ALL'">
            <span>Total users</span>
            <strong>{{ users().length }}</strong>
          </button>
          <button type="button" class="stat-chip" (click)="setFilter('PRO')" [class.is-active]="activeFilter() === 'PRO'">
            <span>Pro users</span>
            <strong>{{ proCount() }}</strong>
          </button>
          <button type="button" class="stat-chip" (click)="setFilter('FREE')" [class.is-active]="activeFilter() === 'FREE'">
            <span>Free users</span>
            <strong>{{ freeCount() }}</strong>
          </button>
          <button type="button" class="stat-chip" (click)="setFilter('AUTHOR')" [class.is-active]="activeFilter() === 'AUTHOR'">
            <span>Authors</span>
            <strong>{{ authorCount() }}</strong>
          </button>
          <button type="button" class="stat-chip" (click)="setFilter('ADMIN')" [class.is-active]="activeFilter() === 'ADMIN'">
            <span>Admins</span>
            <strong>{{ adminCount() }}</strong>
          </button>
        </div>
      </header>

      <div class="message message--error" *ngIf="error()">{{ error() }}</div>
      <div class="message message--success" *ngIf="success()">{{ success() }}</div>

      <div class="admin-grid">
        <section class="panel">
          <div class="panel__head">
            <div>
              <p class="panel__eyebrow">Directory</p>
              <h2>{{ filterLabel() }}</h2>
            </div>
            <div class="panel__tools">
              <label class="search-box">
                <span>Search</span>
                <input
                  type="search"
                  [value]="searchTerm()"
                  (input)="setSearch($event)"
                  placeholder="Name, email, username"
                />
              </label>
              <a routerLink="/" class="panel__link">Back to site</a>
            </div>
          </div>

          <div class="filter-rail" aria-label="User filters">
            <button
              type="button"
              *ngFor="let filter of filters"
              [class.is-active]="activeFilter() === filter.id"
              (click)="setFilter(filter.id)"
            >
              <span>{{ filter.label }}</span>
              <strong>{{ filter.count() }}</strong>
            </button>
          </div>

          <div class="table" *ngIf="!isLoading(); else loadingState">
            <div class="row row--head">
              <span>User</span>
              <span>Plan</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div class="empty-state" *ngIf="filteredUsers().length === 0">
              <strong>No users found</strong>
              <span>Try another filter or search term.</span>
            </div>

            <article class="row" *ngFor="let user of filteredUsers(); trackBy: trackByUserId">
              <div class="user-cell">
                <div class="avatar" [style.--avatar-hue]="getAvatarHue(user)">
                  {{ getInitials(user) }}
                </div>
                <div>
                  <strong>{{ user.fullName || user.username }}</strong>
                  <span>{{ user.email }}</span>
                  <small>@{{ user.username }}</small>
                </div>
              </div>

              <span class="plan-pill" [class.plan-pill--pro]="user.plan === 'PRO'">
                {{ user.plan || 'FREE' }}
              </span>

              <span class="role-badge" [class.role-badge--admin]="user.role === 'ADMIN'" [class.role-badge--author]="user.role === 'AUTHOR'">
                {{ roleLabel(user.role) }}
              </span>

              <span class="status-pill" [class.status-pill--off]="user.isActive === false">
                {{ user.isActive === false ? 'Disabled' : 'Active' }}
              </span>

              <div class="action-stack">
                <div class="role-pills" aria-label="Role actions">
                  <button
                    type="button"
                    *ngFor="let role of roles"
                    [class.is-active]="user.role === role"
                    [disabled]="user.role === role || isUpdating(user)"
                    (click)="setRole(user, role)"
                  >
                    {{ actionLabel(user, role) }}
                  </button>
                </div>

                <button type="button" class="action-btn" [disabled]="isUpdating(user)" (click)="toggleStatus(user)">
                  {{ user.isActive === false ? 'Enable account' : 'Disable account' }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <aside class="panel">
          <div class="panel__head">
            <div>
              <p class="panel__eyebrow">Access Map</p>
              <h2>Privileges</h2>
            </div>
          </div>

          <div class="summary-card">
            <strong>Reader</strong>
            <span>Default member access for reading, profile use, comments, and subscriptions.</span>
          </div>

          <div class="summary-card">
            <strong>Author</strong>
            <span>Can write, edit, publish, manage drafts, newsletters, subscribers, and analytics.</span>
          </div>

          <div class="summary-card">
            <strong>Admin</strong>
            <span>Can promote readers, demote authors, grant admin access, and disable accounts.</span>
          </div>

          <div class="insight-card">
            <span>Author conversion</span>
            <strong>{{ authorConversionRate() }}%</strong>
            <small>{{ authorCount() }} of {{ users().length || 0 }} users have publishing access.</small>
          </div>
        </aside>
      </div>
    </section>

    <ng-template #loadingState>
      <div class="loading">
        <div class="loading-line loading-line--lg"></div>
        <div class="loading-line"></div>
        <div class="loading-line loading-line--sm"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--iw-bg); }
    .admin-page {
      position: relative;
      z-index: 1;
      padding: clamp(18px, 4vw, 42px);
      display: grid;
      gap: 20px;
    }
    .admin-hero,
    .panel,
    .loading {
      border-radius: var(--r-lg);
      border: 1px solid var(--iw-border);
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--iw-surface-strong) 92%, white 8%), var(--iw-surface));
      box-shadow: var(--iw-shadow-lg);
      backdrop-filter: blur(18px);
    }
    .admin-hero {
      overflow: hidden;
      position: relative;
      padding: clamp(22px, 4vw, 38px);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(360px, 0.82fr);
      justify-content: space-between;
      gap: 24px;
      align-items: end;
    }
    .admin-hero::after {
      content: '';
      position: absolute;
      inset: auto -14% -42% 52%;
      height: 260px;
      background: radial-gradient(circle, var(--iw-brand-glow), transparent 68%);
      pointer-events: none;
    }
    .admin-hero__copy,
    .admin-hero__stats { position: relative; z-index: 1; }
    .admin-hero__eyebrow {
      margin: 0 0 10px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--iw-brand);
    }
    .admin-hero h1 {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(2.2rem, 5vw, 4.35rem);
      line-height: 1.05;
      color: var(--iw-ink);
    }
    .admin-hero p { margin: 10px 0 0; color: var(--iw-muted); max-width: 52ch; line-height: 1.6; }
    .admin-hero__stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .stat-chip {
      min-width: 0;
      text-align: left;
      padding: 14px;
      border-radius: var(--r-md);
      border: 1px solid var(--iw-border);
      background: color-mix(in srgb, var(--iw-surface-solid) 82%, transparent);
      transition: var(--trans);
    }
    .stat-chip:hover,
    .stat-chip.is-active {
      border-color: color-mix(in srgb, var(--iw-brand) 48%, var(--iw-border));
      box-shadow: var(--iw-shadow-glow);
      transform: translateY(-1px);
    }
    .stat-chip span { display: block; margin-bottom: 6px; font-size: 0.68rem; color: var(--iw-faint); text-transform: uppercase; letter-spacing: 0.08em; }
    .stat-chip strong { color: var(--iw-ink); font-size: 1.4rem; }
    .message { padding: 14px 16px; border-radius: 14px; font-size: 0.88rem; }
    .message--error { background: rgba(184,56,64,0.08); color: #9f2430; border: 1px solid rgba(184,56,64,0.18); }
    .message--success { background: var(--iw-emerald-soft); color: var(--iw-emerald); border: 1px solid color-mix(in srgb, var(--iw-emerald) 26%, transparent); }
    .admin-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
    .panel { padding: clamp(16px, 2.4vw, 24px); }
    .panel__head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 16px; }
    .panel__eyebrow { margin: 0 0 4px; color: var(--iw-brand); font-size: 0.7rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
    .panel__head h2 { margin: 0; font-family: var(--font-display); font-size: 1.45rem; color: var(--iw-ink); }
    .panel__tools { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .panel__link { color: var(--iw-brand); text-decoration: none; font-weight: 700; }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--r-pill);
      border: 1px solid var(--iw-border);
      background: var(--iw-bg);
    }
    .search-box span { color: var(--iw-faint); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .search-box input {
      width: min(260px, 40vw);
      border: 0;
      outline: 0;
      color: var(--iw-ink);
      background: transparent;
    }
    .filter-rail { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .filter-rail button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 38px;
      padding: 8px 12px;
      border-radius: var(--r-pill);
      border: 1px solid var(--iw-border);
      background: var(--iw-bg);
      color: var(--iw-muted);
      font-weight: 800;
    }
    .filter-rail button.is-active {
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
      border-color: color-mix(in srgb, var(--iw-brand) 38%, var(--iw-border));
    }
    .table { display: grid; gap: 10px; }
    .row { display: grid; grid-template-columns: minmax(220px, 1.45fr) 0.5fr 0.65fr 0.55fr minmax(260px, 1.15fr); gap: 12px; align-items: center; padding: 14px; border: 1px solid var(--iw-border); border-radius: var(--r-md); background: color-mix(in srgb, var(--iw-surface-solid) 76%, transparent); }
    .row:last-child { border-bottom: 0; }
    .row--head { padding: 0 14px; border: 0; background: transparent; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--iw-faint); }
    .user-cell { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 12px; align-items: center; min-width: 0; }
    .avatar {
      --avatar-hue: 34;
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      color: #fff;
      font-weight: 900;
      background: linear-gradient(135deg, hsl(var(--avatar-hue), 62%, 48%), hsl(calc(var(--avatar-hue) + 28), 72%, 34%));
      box-shadow: var(--iw-shadow-sm);
    }
    .user-cell strong { color: var(--iw-ink); }
    .user-cell span,
    .user-cell small { display: block; overflow: hidden; color: var(--iw-muted); font-size: 0.84rem; text-overflow: ellipsis; white-space: nowrap; }
    .user-cell small { color: var(--iw-faint); }
    .role-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .role-pills button,
    .action-btn {
      border: 1px solid var(--iw-border);
      border-radius: 999px;
      background: var(--iw-bg);
      color: var(--iw-ink);
      padding: 8px 12px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: var(--trans);
    }
    .role-pills button:disabled,
    .action-btn:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .role-pills button.is-active { background: var(--iw-brand-soft); color: var(--iw-brand); border-color: color-mix(in srgb, var(--iw-brand) 35%, var(--iw-border) 65%); }
    .plan-pill,
    .role-badge,
    .status-pill { display: inline-flex; width: fit-content; justify-content: center; padding: 8px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 900; }
    .plan-pill { background: rgba(120,120,120,0.08); color: var(--iw-muted); }
    .plan-pill--pro { background: var(--iw-brand-soft); color: var(--iw-brand); }
    .role-badge { background: rgba(120,120,120,0.08); color: var(--iw-muted); }
    .role-badge--author { background: var(--iw-emerald-soft); color: var(--iw-emerald); }
    .role-badge--admin { background: color-mix(in srgb, var(--iw-brand-soft) 80%, rgba(120,80,220,0.12)); color: var(--iw-brand-deep); }
    .status-pill { background: rgba(42,138,106,0.08); color: #1e7757; }
    .status-pill--off { background: rgba(184,56,64,0.08); color: #9f2430; }
    .action-stack { display: grid; gap: 8px; justify-items: start; }
    .summary-card { padding: 16px; border-radius: 18px; border: 1px solid var(--iw-border); background: var(--iw-bg); display: grid; gap: 8px; margin-bottom: 12px; }
    .summary-card strong { color: var(--iw-ink); }
    .summary-card span { color: var(--iw-muted); line-height: 1.6; font-size: 0.88rem; }
    .insight-card {
      margin-top: 16px;
      padding: 18px;
      border-radius: var(--r-lg);
      color: var(--iw-ink);
      background: linear-gradient(135deg, var(--iw-brand-soft), color-mix(in srgb, var(--iw-bg) 84%, var(--iw-brand) 16%));
      border: 1px solid color-mix(in srgb, var(--iw-brand) 26%, var(--iw-border));
    }
    .insight-card span,
    .insight-card small { display: block; color: var(--iw-muted); }
    .insight-card strong { display: block; margin: 4px 0; font-size: 2rem; font-family: var(--font-display); }
    .empty-state {
      display: grid;
      gap: 4px;
      justify-items: center;
      padding: 34px 18px;
      border: 1px dashed var(--iw-border-2);
      border-radius: var(--r-md);
      color: var(--iw-muted);
    }
    .empty-state strong { color: var(--iw-ink); }
    .loading { padding: 22px; display: grid; gap: 12px; }
    .loading-line { height: 13px; border-radius: 999px; background: linear-gradient(90deg, var(--iw-border), color-mix(in srgb, var(--iw-border) 60%, white 40%), var(--iw-border)); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
    .loading-line--lg { width: 44%; height: 20px; }
    .loading-line--sm { width: 28%; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    @media (max-width: 1160px) {
      .admin-hero { grid-template-columns: 1fr; }
      .admin-grid { grid-template-columns: 1fr; }
      .row { grid-template-columns: minmax(220px, 1.3fr) 0.45fr 0.55fr 0.55fr; }
      .row .action-stack { grid-column: 1 / -1; }
    }
    @media (max-width: 820px) {
      .admin-hero__stats { grid-template-columns: 1fr; }
      .panel__head { align-items: flex-start; flex-direction: column; }
      .panel__tools { width: 100%; justify-content: space-between; }
      .search-box { width: 100%; }
      .search-box input { width: 100%; }
      .row { grid-template-columns: 1fr; }
      .row--head { display: none; }
      .plan-pill,
      .role-badge,
      .status-pill { width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly authApi = inject(AuthApiService);

  readonly users = signal<AuthUser[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly activeFilter = signal<AdminUserFilter>('ALL');
  readonly searchTerm = signal('');
  readonly updatingUserIds = signal<Set<number>>(new Set());
  readonly roles: UserRole[] = ['READER', 'AUTHOR', 'ADMIN'];
  readonly proCount = computed(() => this.users().filter((user) => user.plan === 'PRO').length);
  readonly freeCount = computed(() => this.users().filter((user) => (user.plan ?? 'FREE') === 'FREE').length);
  readonly readerCount = computed(() => this.users().filter((user) => user.role === 'READER').length);
  readonly authorCount = computed(() => this.users().filter((user) => user.role === 'AUTHOR').length);
  readonly adminCount = computed(() => this.users().filter((user) => user.role === 'ADMIN').length);
  readonly authorConversionRate = computed(() => {
    const total = this.users().length;
    return total ? Math.round((this.authorCount() / total) * 100) : 0;
  });
  readonly filterLabel = computed(() => {
    const active = this.filters.find((filter) => filter.id === this.activeFilter());
    return active?.heading ?? 'All users';
  });
  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    return this.users().filter((user) => {
      const matchesFilter = this.matchesFilter(user, this.activeFilter());
      const matchesSearch =
        !term ||
        [user.fullName, user.email, user.username, user.role, user.plan]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesFilter && matchesSearch;
    });
  });

  readonly filters: Array<{
    id: AdminUserFilter;
    label: string;
    heading: string;
    count: () => number;
  }> = [
    { id: 'ALL', label: 'All', heading: 'All platform users', count: () => this.users().length },
    { id: 'PRO', label: 'Pro', heading: 'Pro subscribers', count: () => this.proCount() },
    { id: 'FREE', label: 'Free', heading: 'Free plan users', count: () => this.freeCount() },
    { id: 'READER', label: 'Readers', heading: 'Reader accounts', count: () => this.readerCount() },
    { id: 'AUTHOR', label: 'Authors', heading: 'Author accounts', count: () => this.authorCount() },
    { id: 'ADMIN', label: 'Admins', heading: 'Admin accounts', count: () => this.adminCount() },
  ];

  ngOnInit() {
    this.loadUsers();
  }

  setFilter(filter: AdminUserFilter) {
    this.activeFilter.set(filter);
  }

  setSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  setRole(user: AuthUser, role: UserRole) {
    if (user.role === role) {
      return;
    }

    this.markUpdating(user.userId, true);
    this.error.set(null);
    this.success.set(null);

    this.authApi.updateAdminUserRole(user.userId, { role }).subscribe({
      next: (updatedUser) => {
        this.users.update((users) =>
          users.map((item) => (item.userId === user.userId ? { ...item, ...updatedUser, role } : item)),
        );
        this.success.set(`${user.fullName || user.username} is now ${this.roleLabel(role).toLowerCase()}.`);
        this.markUpdating(user.userId, false);
      },
      error: (error) => {
        this.error.set(
          error?.error?.message ??
            (error instanceof Error ? error.message : null) ??
            'Unable to update the selected user role.',
        );
        this.markUpdating(user.userId, false);
      },
    });
  }

  toggleStatus(user: AuthUser) {
    const enabled = user.isActive === false;

    this.markUpdating(user.userId, true);
    this.error.set(null);
    this.success.set(null);

    this.authApi.updateAdminUserStatus(user.userId, { enabled }).subscribe({
      next: (updatedUser) => {
        this.users.update((users) =>
          users.map((item) => (item.userId === user.userId ? { ...item, ...updatedUser, isActive: enabled } : item)),
        );
        this.success.set(`${user.fullName || user.username} has been ${enabled ? 'enabled' : 'disabled'}.`);
        this.markUpdating(user.userId, false);
      },
      error: (error) => {
        this.error.set(
          error?.error?.message ??
            (error instanceof Error ? error.message : null) ??
            'Unable to update the selected user status.',
        );
        this.markUpdating(user.userId, false);
      },
    });
  }

  actionLabel(user: AuthUser, role: UserRole): string {
    if (user.role === role) {
      return 'Current';
    }

    if (role === 'AUTHOR') {
      return 'Promote author';
    }

    if (role === 'ADMIN') {
      return 'Promote admin';
    }

    return user.role === 'AUTHOR' ? 'Demote reader' : 'Set reader';
  }

  roleLabel(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'AUTHOR':
        return 'Author';
      case 'READER':
      default:
        return 'Reader';
    }
  }

  getInitials(user: AuthUser): string {
    const label = user.fullName || user.username || user.email || 'U';
    return label
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarHue(user: AuthUser): number {
    const value = `${user.userId}${user.email}${user.username}`;
    return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  }

  isUpdating(user: AuthUser): boolean {
    return this.updatingUserIds().has(user.userId);
  }

  trackByUserId(_: number, user: AuthUser): number {
    return user.userId;
  }

  private loadUsers() {
    this.authApi
      .getAdminUsers()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: (error) => {
          this.error.set(
            error?.error?.message ??
              (error instanceof Error ? error.message : null) ??
              'Unable to load admin user data.',
          );
        },
      });
  }

  private matchesFilter(user: AuthUser, filter: AdminUserFilter): boolean {
    switch (filter) {
      case 'PRO':
        return user.plan === 'PRO';
      case 'FREE':
        return (user.plan ?? 'FREE') === 'FREE';
      case 'READER':
      case 'AUTHOR':
      case 'ADMIN':
        return user.role === filter;
      case 'ALL':
      default:
        return true;
    }
  }

  private markUpdating(userId: number, isUpdating: boolean) {
    this.updatingUserIds.update((ids) => {
      const next = new Set(ids);
      if (isUpdating) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }
}
