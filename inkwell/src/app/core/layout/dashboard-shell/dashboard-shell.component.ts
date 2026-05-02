import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthSessionService } from '../../../features/auth/data-access/auth-session.service';
import { AuthApiService } from '../../../features/auth/data-access/auth-api.service';
import { PostApiService } from '../../../features/author/data-access/post-api.service';
import { ThemeService } from '../../theme/theme.service';
import { NotificationApiService, Notification } from '../../../features/dashboard/data-access/notification-api.service';
import { catchError, of } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number | null;
}

interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.shell--collapsed]="sidebarCollapsed()" [class.shell--mobile-open]="mobileOpen()">

      <!-- ═══════════════════════ SIDEBAR ═══════════════════════ -->
      <aside class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed()">

        <!-- Sidebar top: logo + collapse toggle -->
        <div class="sidebar-top">
          <a routerLink="/" class="sidebar-logo" [class.logo--mini]="sidebarCollapsed()">
            <div class="logo-mark">✦</div>
            <div class="logo-wordmark" *ngIf="!sidebarCollapsed()">
              <span class="logo-name">InkWell</span>
              <span class="logo-tag">Dashboard</span>
            </div>
          </a>

          <button class="collapse-btn" (click)="toggleSidebar()" [title]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
            <span class="collapse-icon" [class.flipped]="sidebarCollapsed()">‹</span>
          </button>
        </div>

        <!-- User mini-card -->
        <div class="sidebar-user" [class.user--mini]="sidebarCollapsed()">
          <div class="user-avatar">{{ userInitials() }}</div>
          <div class="user-info" *ngIf="!sidebarCollapsed()">
            <div class="user-name">{{ userName() }}</div>
            <div class="user-plan">
              <span class="plan-dot" [class.plan-dot--pro]="userPlan() === 'PRO'"></span>
              {{ userPlan() === 'PRO' ? 'Pro Member' : 'Free Plan' }}
            </div>
          </div>
        </div>

        <!-- Write CTA -->
        <div class="sidebar-write" [class.write--mini]="sidebarCollapsed()">
          <a routerLink="/write" class="write-btn" [title]="sidebarCollapsed() ? 'New post' : ''">
            <span class="write-icon">✍</span>
            <span class="write-label" *ngIf="!sidebarCollapsed()">New Post</span>
          </a>
        </div>

        <!-- Nav groups -->
        <nav class="sidebar-nav">
          <div class="nav-group" *ngFor="let group of navGroups">
            <div class="nav-group-label" *ngIf="group.groupLabel && !sidebarCollapsed()">
              {{ group.groupLabel }}
            </div>
            <a
              *ngFor="let item of group.items"
              [routerLink]="item.route"
              routerLinkActive="nav-item--active"
              class="nav-item"
              [class.nav-item--mini]="sidebarCollapsed()"
              [title]="sidebarCollapsed() ? item.label : ''"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
              <span class="nav-badge" *ngIf="item.badge && !sidebarCollapsed()">{{ item.badge }}</span>
              <span class="nav-badge nav-badge--mini" *ngIf="item.badge && sidebarCollapsed()">{{ item.badge }}</span>
            </a>
          </div>
        </nav>

        <!-- Sidebar footer -->
        <div class="sidebar-footer">
          <a routerLink="/profile" class="sidebar-footer-item" [class.footer-item--mini]="sidebarCollapsed()" title="Profile">
            <span>👤</span>
            <span *ngIf="!sidebarCollapsed()">Profile</span>
          </a>
          <a routerLink="/profile" fragment="account-security" class="sidebar-footer-item" [class.footer-item--mini]="sidebarCollapsed()" title="Settings">
            <span>⚙</span>
            <span *ngIf="!sidebarCollapsed()">Settings</span>
          </a>
          <button (click)="logout()" class="sidebar-footer-item sidebar-footer-item--danger" [class.footer-item--mini]="sidebarCollapsed()" title="Sign out">
            <span>⏻</span>
            <span *ngIf="!sidebarCollapsed()">Sign out</span>
          </button>
        </div>
      </aside>

      <!-- Mobile overlay -->
      <div class="mobile-overlay" (click)="closeMobile()" *ngIf="mobileOpen()"></div>

      <!-- ═══════════════════════ MAIN AREA ═══════════════════════ -->
      <div class="main-area">

        <!-- Top header bar -->
        <header class="topbar">
          <!-- Mobile hamburger -->
          <button class="mobile-menu-btn" (click)="openMobile()">
            <span></span><span></span><span></span>
          </button>

          <!-- Breadcrumb / page title (slot) -->
          <div class="topbar-title">
            <span class="topbar-section">Dashboard</span>
          </div>

          <!-- Topbar right -->
          <div class="topbar-right">
            <!-- Search -->
            <button class="topbar-icon-btn" title="Search">🔍</button>

            <!-- Notifications -->
            <div class="notif-wrapper">
              <button class="topbar-icon-btn notif-btn" (click)="toggleNotifications()" title="Notifications">
                🔔
                <span class="notif-dot" *ngIf="unreadCount() > 0"></span>
              </button>

              <!-- Notifications Dropdown -->
              <div class="notif-dropdown" *ngIf="notificationsOpen()">
                <div class="notif-header">
                  <h3>Notifications</h3>
                  <button (click)="markAllAsRead()" *ngIf="unreadCount() > 0">Mark all as read</button>
                </div>
                <div class="notif-list">
                  <div *ngIf="notifications().length === 0" class="notif-empty">
                    <p>No new notifications</p>
                  </div>
                  <div 
                    *ngFor="let n of notifications()" 
                    class="notif-item" 
                    [class.notif-item--unread]="!n.isRead"
                    (click)="markAsRead(n)"
                  >
                    <div class="notif-icon">
                      {{ n.type === 'AUTHOR_VERIFICATION' ? '📝' : '🔔' }}
                    </div>
                    <div class="notif-body">
                      <div class="notif-title">{{ n.title }}</div>
                      <p class="notif-message">{{ n.message }}</p>
                      <span class="notif-time">{{ n.createdAt | date:'shortTime' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Animated Theme Toggle -->
            <div class="theme-toggle-wrap">
               <button class="theme-slider-btn" (click)="toggleTheme()" [title]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' mode'">
                  <div class="slider-track" [class.slider-track--dark]="isDark()">
                     <div class="slider-thumb" [class.slider-thumb--dark]="isDark()">
                        <span class="thumb-icon">{{ isDark() ? '🌙' : '☀️' }}</span>
                     </div>
                  </div>
               </button>
            </div>

            <!-- Avatar -->
            <div class="topbar-avatar" routerLink="/profile">{{ userInitials() }}</div>
          </div>
        </header>

        <!-- Page content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- ═══════════════════════ FAB: WRITE ═══════════════════════ -->
      <a routerLink="/write" class="fab-write" title="Write new post">
        <span class="fab-icon">✍</span>
        <span class="fab-label">Write</span>
      </a>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .shell { display: flex; height: 100vh; background: var(--iw-bg); overflow: hidden; position: relative; }
    .sidebar {
      width: 248px; height: 100vh; background: var(--iw-bg-alt);
      border-right: 1px solid var(--iw-border); display: flex; flex-direction: column;
      flex-shrink: 0; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden; position: relative; z-index: 50; backdrop-filter: blur(10px);
    }
    .sidebar--collapsed { width: 68px; }
    .sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px 16px; border-bottom: 1px solid var(--iw-border); flex-shrink: 0; }
    .sidebar-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; overflow: hidden; }
    .logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #9a5f1a, var(--iw-brand)); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1rem; flex-shrink: 0; box-shadow: 0 2px 8px var(--iw-brand-glow); }
    .logo-wordmark { display: flex; flex-direction: column; overflow: hidden; }
    .logo-name { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--iw-ink); line-height: 1.1; white-space: nowrap; }
    .logo-tag { font-size: 0.65rem; color: var(--iw-ink-muted); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
    .collapse-btn { width: 28px; height: 28px; border: 1px solid var(--iw-border); background: var(--iw-bg); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--iw-ink-muted); transition: all 0.2s; flex-shrink: 0; }
    .collapse-btn:hover { border-color: var(--iw-brand); color: var(--iw-brand); }
    .collapse-icon { font-size: 1.1rem; display: block; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .collapse-icon.flipped { transform: rotate(180deg); }
    .sidebar-user { display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1px solid var(--iw-border); flex-shrink: 0; }
    .user--mini { justify-content: center; padding: 16px 8px; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #9a5f1a, var(--iw-brand)); color: #fff; font-size: 0.78rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-info { overflow: hidden; }
    .user-name { font-size: 0.88rem; font-weight: 700; color: var(--iw-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-plan { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: var(--iw-ink-muted); font-weight: 600; }
    .plan-dot { width: 5px; height: 5px; background: var(--iw-ink-muted); border-radius: 50%; }
    .plan-dot--pro { background: var(--iw-brand); animation: pulsePlan 2s ease-in-out infinite; }
    @keyframes pulsePlan { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .sidebar-write { padding: 14px 12px; border-bottom: 1px solid var(--iw-border); flex-shrink: 0; }
    .write--mini { padding: 12px 8px; display: flex; justify-content: center; }
    .write-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #9a5f1a, var(--iw-brand)); color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 700; text-decoration: none; transition: all 0.2s; box-shadow: 0 2px 12px var(--iw-brand-glow); white-space: nowrap; overflow: hidden; }
    .write--mini .write-btn { padding: 10px; border-radius: 10px; justify-content: center; width: 42px; height: 42px; }
    .write-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px var(--iw-brand-glow); }
    .write-icon { font-size: 1rem; flex-shrink: 0; }
    .sidebar-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 0; scrollbar-width: thin; scrollbar-color: var(--iw-border) transparent; }
    .nav-group { margin-bottom: 4px; }
    .nav-group-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--iw-ink-muted); padding: 14px 16px 6px; opacity: 0.6; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 0.88rem; font-weight: 500; color: var(--iw-ink-muted); text-decoration: none; border-radius: 10px; margin: 1px 8px; transition: all 0.18s; position: relative; white-space: nowrap; overflow: hidden; }
    .nav-item:hover { background: var(--iw-brand-soft); color: var(--iw-ink); }
    .nav-item--active { background: var(--iw-brand-soft) !important; color: var(--iw-brand) !important; font-weight: 700; }
    .nav-item--mini { justify-content: center; padding: 10px; margin: 1px 6px; }
    .nav-icon { font-size: 1.05rem; flex-shrink: 0; width: 20px; text-align: center; }
    .nav-label { flex: 1; }
    .nav-badge { background: var(--iw-brand); color: #fff; font-size: 0.62rem; font-weight: 800; padding: 1px 7px; border-radius: 100px; min-width: 18px; text-align: center; }
    .nav-badge--mini { position: absolute; top: 4px; right: 4px; padding: 1px 4px; font-size: 0.55rem; min-width: 14px; }
    .sidebar-footer { border-top: 1px solid var(--iw-border); padding: 10px 8px; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
    .sidebar-footer-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; color: var(--iw-ink-muted); text-decoration: none; background: none; border: none; cursor: pointer; transition: all 0.18s; white-space: nowrap; overflow: hidden; width: 100%; text-align: left; }
    .sidebar-footer-item:hover { background: var(--iw-brand-soft); color: var(--iw-ink); }
    .sidebar-footer-item--danger:hover { background: rgba(220,50,50,0.08); color: #c0392b; }
    .footer-item--mini { justify-content: center; }
    .theme-toggle-wrap { margin: 0 8px; }
    .theme-slider-btn { background: none; border: none; padding: 0; cursor: pointer; }
    .slider-track { width: 48px; height: 26px; background: var(--iw-border); border-radius: 20px; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--iw-border); }
    .slider-track--dark { background: var(--iw-brand-soft); border-color: var(--iw-brand); }
    .slider-thumb { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .slider-thumb--dark { left: 24px; background: var(--iw-brand); }
    .thumb-icon { font-size: 0.7rem; }
    .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar { height: 60px; background: var(--iw-bg-alt); border-bottom: 1px solid var(--iw-border); display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0; backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 30; }
    .mobile-menu-btn { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; }
    .mobile-menu-btn span { display: block; width: 20px; height: 2px; background: var(--iw-ink); border-radius: 2px; transition: all 0.2s; }
    .topbar-title { flex: 1; }
    .topbar-section { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: var(--iw-ink); }
    .topbar-right { display: flex; align-items: center; gap: 4px; }
    .topbar-icon-btn { width: 36px; height: 36px; background: none; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--iw-ink-muted); transition: all 0.18s; position: relative; }
    .topbar-icon-btn:hover { background: var(--iw-brand-soft); color: var(--iw-ink); }
    .notif-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; background: var(--iw-brand); border-radius: 50%; border: 1.5px solid var(--iw-bg-alt); animation: pulsePlan 2s ease-in-out infinite; }
    .topbar-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #9a5f1a, var(--iw-brand)); color: #fff; font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-left: 6px; cursor: pointer; transition: transform 0.2s; }
    .topbar-avatar:hover { transform: scale(1.08); }
    .main-content { flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: var(--iw-border) transparent; background: radial-gradient(circle at top right, var(--iw-brand-soft), transparent 400px); }
    .fab-write { display: none; position: fixed; bottom: 28px; right: 24px; background: linear-gradient(135deg, #9a5f1a, var(--iw-brand)); color: #fff; padding: 14px 22px; border-radius: 100px; font-size: 0.9rem; font-weight: 700; text-decoration: none; box-shadow: 0 4px 20px var(--iw-brand-glow); gap: 8px; align-items: center; z-index: 60; transition: all 0.25s; }
    .fab-write:hover { transform: translateY(-3px); box-shadow: 0 8px 32px var(--iw-brand-glow); }
    .fab-icon { font-size: 1.1rem; }
    @media (max-width: 900px) {
      .sidebar { position: fixed; top: 0; left: 0; height: 100vh; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s; z-index: 50; width: 248px !important; }
      .shell--mobile-open .sidebar { transform: translateX(0); }
      .mobile-menu-btn { display: flex; }
      .main-area { width: 100%; }
      .fab-write { display: flex; }
    }
    .notif-wrapper { position: relative; }
    .notif-dropdown {
      position: absolute; top: 100%; right: 0; width: 320px; max-height: 480px;
      background: var(--iw-bg-alt); border: 1px solid var(--iw-border); border-radius: 16px;
      box-shadow: var(--iw-shadow-lg); z-index: 100; margin-top: 10px; display: flex; flex-direction: column;
      overflow: hidden; animation: dropdownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(20px);
    }
    @keyframes dropdownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .notif-header { padding: 16px; border-bottom: 1px solid var(--iw-border); display: flex; justify-content: space-between; align-items: center; }
    .notif-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--iw-ink); }
    .notif-header button { background: none; border: none; font-size: 0.75rem; color: var(--iw-brand); font-weight: 600; cursor: pointer; }
    .notif-list { overflow-y: auto; flex: 1; }
    .notif-empty { padding: 40px 20px; text-align: center; color: var(--iw-ink-muted); font-size: 0.85rem; }
    .notif-item { padding: 12px 16px; border-bottom: 1px solid var(--iw-border); display: flex; gap: 12px; cursor: pointer; transition: background 0.2s; }
    .notif-item:hover { background: var(--iw-brand-soft); }
    .notif-item--unread { background: rgba(var(--iw-brand-rgb), 0.03); }
    .notif-icon { width: 32px; height: 32px; border-radius: 50%; background: var(--iw-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem; border: 1px solid var(--iw-border); }
    .notif-body { flex: 1; }
    .notif-title { font-size: 0.85rem; font-weight: 700; color: var(--iw-ink); margin-bottom: 2px; }
    .notif-message { font-size: 0.78rem; color: var(--iw-ink-muted); margin: 0 0 4px; line-height: 1.4; }
    .notif-time { font-size: 0.7rem; color: var(--iw-ink-muted); opacity: 0.6; }
  `],
})
export class DashboardShellComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly notificationApi = inject(NotificationApiService);
  private readonly postApi = inject(PostApiService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);
  notificationsOpen = signal(false);
  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  userName = computed(() => this.authSession.user()?.fullName ?? 'User');
  userPlan = computed(() => this.authSession.user()?.plan ?? 'FREE');
  userInitials = computed(() => {
    const name = this.userName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  });

  isDark = computed(() => this.themeService.resolvedTheme() === 'dark');

  navGroups: NavGroup[] = [
    {
      items: [
        { icon: '⊞', label: 'Overview', route: '/dashboard' },
        { icon: '📄', label: 'My Posts', route: '/dashboard/posts', badge: this.postApi.authorPosts().length || null },
        { icon: '📊', label: 'Analytics', route: '/dashboard/analytics' },
        { icon: '💌', label: 'Newsletter', route: '/dashboard/newsletter', badge: 1 },
      ],
    },
    {
      groupLabel: 'Monetization',
      items: [
        { icon: '💰', label: 'Earnings', route: '/dashboard/earnings' },
        { icon: '👥', label: 'Subscribers', route: '/dashboard/subscribers' },
      ],
    },
    {
      groupLabel: 'Content',
      items: [
        { icon: '✍', label: 'Editor', route: '/write' },
        { icon: '🗂', label: 'Drafts', route: '/dashboard/drafts', badge: 5 },
        { icon: '🏷', label: 'Topics', route: '/dashboard/topics' },
      ],
    },
  ];

  ngOnInit() {
    this.authApi.getProfile().subscribe({
      next: (user: any) => {
        this.authSession.saveUser(user);
        this.postApi.refreshAuthorPosts();
      },
      error: () => {}
    });
    this.fetchNotifications();
  }

  fetchNotifications() {
    const user = this.authSession.getUser();
    if (!user?.userId) return;
    this.notificationApi.getNotifications(user.userId).pipe(
      catchError(() => of([]))
    ).subscribe(notifs => this.notifications.set(notifs));
  }

  toggleNotifications() {
    this.notificationsOpen.update(v => !v);
  }

  markAsRead(notif: Notification) {
    if (notif.isRead) return;
    this.notificationApi.markAsRead(notif.id).subscribe(() => {
      this.notifications.update(list => 
        list.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
    });
  }

  markAllAsRead() {
    const user = this.authSession.getUser();
    if (!user?.userId) return;
    this.notificationApi.markAllAsRead(user.userId).subscribe(() => {
      this.notifications.update(list => 
        list.map(n => ({ ...n, isRead: true }))
      );
      this.toast.info('All notifications marked as read.');
    });
  }

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }
  openMobile() { this.mobileOpen.set(true); }
  closeMobile() { this.mobileOpen.set(false); }
  toggleTheme() { this.themeService.toggle(); }
  logout() {
    this.authApi.logout().subscribe({
      next: () => {
        this.authSession.clearToken();
        this.toast.info('Signed out successfully.');
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.authSession.clearToken();
        void this.router.navigate(['/login']);
      },
    });
  }
}
