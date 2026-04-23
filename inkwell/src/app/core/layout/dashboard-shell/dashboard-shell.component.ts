import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-info" *ngIf="!sidebarCollapsed()">
            <div class="user-name">Arjun Sharma</div>
            <div class="user-plan">
              <span class="plan-dot"></span>
              Pro Member
            </div>
          </div>
        </div>

        <!-- Write CTA -->
        <div class="sidebar-write" [class.write--mini]="sidebarCollapsed()">
          <a routerLink="/dashboard/editor" class="write-btn" [title]="sidebarCollapsed() ? 'New post' : ''">
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
          <a routerLink="/dashboard/settings" class="sidebar-footer-item" [class.footer-item--mini]="sidebarCollapsed()" title="Settings">
            <span>⚙</span>
            <span *ngIf="!sidebarCollapsed()">Settings</span>
          </a>
          <button class="sidebar-footer-item sidebar-footer-item--danger" [class.footer-item--mini]="sidebarCollapsed()" title="Sign out">
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
            <button class="topbar-icon-btn notif-btn" title="Notifications">
              🔔
              <span class="notif-dot"></span>
            </button>

            <!-- Theme toggle placeholder -->
            <button class="topbar-icon-btn" title="Toggle theme">◐</button>

            <!-- Avatar -->
            <div class="topbar-avatar">{{ userInitials }}</div>
          </div>
        </header>

        <!-- Page content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- ═══════════════════════ FAB: WRITE ═══════════════════════ -->
      <a routerLink="/dashboard/editor" class="fab-write" title="Write new post">
        <span class="fab-icon">✍</span>
        <span class="fab-label">Write</span>
      </a>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════
       SHELL LAYOUT
    ══════════════════════════════════════════ */
    :host {
      display: block;
      height: 100vh;
    }

    .shell {
      display: flex;
      height: 100vh;
      background: var(--iw-bg);
      overflow: hidden;
      position: relative;
    }

    /* ══════════════════════════════════════════
       SIDEBAR
    ══════════════════════════════════════════ */
    .sidebar {
      width: 248px;
      height: 100vh;
      background: var(--iw-bg-alt);
      border-right: 1px solid var(--iw-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      position: relative;
      z-index: 50;
    }

    .sidebar--collapsed {
      width: 68px;
    }

    /* TOP */
    .sidebar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px 16px;
      border-bottom: 1px solid var(--iw-border);
      flex-shrink: 0;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      overflow: hidden;
    }

    .logo-mark {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px var(--iw-brand-glow);
    }

    .logo-wordmark {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .logo-name {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--iw-ink);
      line-height: 1.1;
      white-space: nowrap;
    }

    .logo-tag {
      font-size: 0.65rem;
      color: var(--iw-ink-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .collapse-btn {
      width: 28px;
      height: 28px;
      border: 1px solid var(--iw-border);
      background: var(--iw-bg);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--iw-ink-muted);
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .collapse-btn:hover {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
    }

    .collapse-icon {
      font-size: 1.1rem;
      display: block;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .collapse-icon.flipped {
      transform: rotate(180deg);
    }

    /* USER CARD */
    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid var(--iw-border);
      flex-shrink: 0;
    }

    .user--mini {
      justify-content: center;
      padding: 16px 8px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
      font-size: 0.78rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      overflow: hidden;
    }

    .user-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--iw-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-plan {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      color: var(--iw-brand);
      font-weight: 600;
    }

    .plan-dot {
      width: 5px;
      height: 5px;
      background: var(--iw-brand);
      border-radius: 50%;
      animation: pulsePlan 2s ease-in-out infinite;
    }
    @keyframes pulsePlan {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* WRITE CTA */
    .sidebar-write {
      padding: 14px 12px;
      border-bottom: 1px solid var(--iw-border);
      flex-shrink: 0;
    }

    .write--mini {
      padding: 12px 8px;
      display: flex;
      justify-content: center;
    }

    .write-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
      box-shadow: 0 2px 12px var(--iw-brand-glow);
      white-space: nowrap;
      overflow: hidden;
    }

    .write--mini .write-btn {
      padding: 10px;
      border-radius: 10px;
      justify-content: center;
      width: 42px;
      height: 42px;
    }

    .write-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px var(--iw-brand-glow);
    }

    .write-icon { font-size: 1rem; flex-shrink: 0; }

    /* NAV */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 0;
      scrollbar-width: thin;
      scrollbar-color: var(--iw-border) transparent;
    }

    .nav-group {
      margin-bottom: 4px;
    }

    .nav-group-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--iw-ink-muted);
      padding: 14px 16px 6px;
      opacity: 0.6;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--iw-ink-muted);
      text-decoration: none;
      border-radius: 10px;
      margin: 1px 8px;
      transition: all 0.18s;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
    }

    .nav-item:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-ink);
    }

    .nav-item--active {
      background: var(--iw-brand-soft) !important;
      color: var(--iw-brand) !important;
      font-weight: 700;
    }

    .nav-item--active .nav-icon {
      filter: none;
    }

    .nav-item--mini {
      justify-content: center;
      padding: 10px;
      margin: 1px 6px;
    }

    .nav-icon {
      font-size: 1.05rem;
      flex-shrink: 0;
      width: 20px;
      text-align: center;
    }

    .nav-label {
      flex: 1;
    }

    .nav-badge {
      background: var(--iw-brand);
      color: #fff;
      font-size: 0.62rem;
      font-weight: 800;
      padding: 1px 7px;
      border-radius: 100px;
      min-width: 18px;
      text-align: center;
    }

    .nav-badge--mini {
      position: absolute;
      top: 4px;
      right: 4px;
      padding: 1px 4px;
      font-size: 0.55rem;
      min-width: 14px;
    }

    /* SIDEBAR FOOTER */
    .sidebar-footer {
      border-top: 1px solid var(--iw-border);
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-shrink: 0;
    }

    .sidebar-footer-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--iw-ink-muted);
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.18s;
      white-space: nowrap;
      overflow: hidden;
      width: 100%;
      text-align: left;
    }

    .sidebar-footer-item:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-ink);
    }

    .sidebar-footer-item--danger:hover {
      background: rgba(220,50,50,0.08);
      color: #c0392b;
    }

    .footer-item--mini {
      justify-content: center;
    }

    /* ══════════════════════════════════════════
       MOBILE OVERLAY
    ══════════════════════════════════════════ */
    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 40;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ══════════════════════════════════════════
       MAIN AREA
    ══════════════════════════════════════════ */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* TOPBAR */
    .topbar {
      height: 60px;
      background: var(--iw-bg-alt);
      border-bottom: 1px solid var(--iw-border);
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
      flex-shrink: 0;
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 30;
    }

    .mobile-menu-btn {
      display: none;
      flex-direction: column;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
    }
    .mobile-menu-btn span {
      display: block;
      width: 20px;
      height: 2px;
      background: var(--iw-ink);
      border-radius: 2px;
      transition: all 0.2s;
    }

    .topbar-title {
      flex: 1;
    }

    .topbar-section {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--iw-ink);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .topbar-icon-btn {
      width: 36px;
      height: 36px;
      background: none;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: var(--iw-ink-muted);
      transition: all 0.18s;
      position: relative;
    }
    .topbar-icon-btn:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-ink);
    }

    .notif-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 7px; height: 7px;
      background: var(--iw-brand);
      border-radius: 50%;
      border: 1.5px solid var(--iw-bg-alt);
      animation: pulsePlan 2s ease-in-out infinite;
    }

    .topbar-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 6px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .topbar-avatar:hover { transform: scale(1.08); }

    /* MAIN CONTENT */
    .main-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: var(--iw-border) transparent;
    }

    /* ══════════════════════════════════════════
       FAB
    ══════════════════════════════════════════ */
    .fab-write {
      display: none;
      position: fixed;
      bottom: 28px;
      right: 24px;
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
      padding: 14px 22px;
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 20px var(--iw-brand-glow);
      gap: 8px;
      align-items: center;
      z-index: 60;
      transition: all 0.25s;
    }
    .fab-write:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 32px var(--iw-brand-glow);
    }

    .fab-icon { font-size: 1.1rem; }

    /* ══════════════════════════════════════════
       RESPONSIVE
    ══════════════════════════════════════════ */
    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        top: 0; left: 0;
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s;
        z-index: 50;
        width: 248px !important;
      }

      .shell--mobile-open .sidebar {
        transform: translateX(0);
      }

      .mobile-menu-btn {
        display: flex;
      }

      .main-area {
        width: 100%;
      }

      .fab-write {
        display: flex;
      }
    }
  `],
})
export class DashboardShellComponent {
  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);

  userInitials = 'AS';

  navGroups: NavGroup[] = [
    {
      items: [
        { icon: '⊞', label: 'Overview', route: '/dashboard' },
        { icon: '📄', label: 'My Posts', route: '/dashboard/posts', badge: 3 },
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
        { icon: '✍', label: 'Editor', route: '/dashboard/editor' },
        { icon: '🗂', label: 'Drafts', route: '/dashboard/drafts', badge: 5 },
        { icon: '🏷', label: 'Topics', route: '/dashboard/topics' },
      ],
    },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  openMobile(): void {
    this.mobileOpen.set(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}