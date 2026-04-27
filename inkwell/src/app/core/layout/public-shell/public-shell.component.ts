import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { AuthSessionService } from '../../../features/auth/data-access/auth-session.service';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <div class="shell">

      <!-- ══ NAVBAR ══ -->
      <header class="navbar" [class.navbar--scrolled]="isScrolled()">
        <div class="navbar__inner">

          <!-- Brand -->
          <a class="navbar__brand" routerLink="/">
            <div class="navbar__logo">
              <span class="navbar__quill">✒</span>
            </div>
            <div class="navbar__wordmark">
              <strong class="navbar__name">InkWell</strong>
              <small class="navbar__tagline">Ideas worth rereading</small>
            </div>
          </a>

          <!-- Desktop Nav -->
          <nav class="navbar__nav" aria-label="Primary">
            <a class="navbar__link"
               routerLink="/"
               routerLinkActive="navbar__link--active"
               [routerLinkActiveOptions]="{ exact: true }">
              Home
            </a>
            <a class="navbar__link"
               routerLink="/feed"
               routerLinkActive="navbar__link--active">
              Explore
            </a>
            <a class="navbar__link"
               routerLink="/pricing"
               routerLinkActive="navbar__link--active">
              Pricing
            </a>
            <a *ngIf="canWrite()"
               class="navbar__link"
               routerLink="/write"
               routerLinkActive="navbar__link--active">
              Write
            </a>
          </nav>

          <!-- Actions -->
          <div class="navbar__actions">
            <app-theme-toggle />

            <ng-container *ngIf="isAuthenticated(); else guestActions">
              <!-- Profile -->
              <a class="btn btn-ghost btn-sm navbar__ghost" routerLink="/profile" title="Profile">
                <span class="btn-label">Profile</span>
                <span class="btn-icon">👤</span>
              </a>
              
              <!-- Dashboard -->
              <ng-container *ngIf="canWrite(); else lockedDashboard">
                <a class="btn btn-brand btn-sm navbar__cta" [routerLink]="dashboardRoute()" title="Dashboard">
                  <span class="btn-label">Dashboard →</span>
                  <span class="btn-icon">📊</span>
                </a>
              </ng-container>
              <ng-template #lockedDashboard>
                <a class="btn btn-ghost btn-sm navbar__cta navbar__cta--locked" routerLink="/become-author" title="Become Author">
                  <span class="btn-label">Dashboard 🔒</span>
                  <span class="btn-icon">🔒</span>
                </a>
              </ng-template>
            </ng-container>

            <ng-template #guestActions>
              <a class="btn btn-ghost btn-sm navbar__ghost navbar__ghost--locked" routerLink="/login" title="Login">
                <span class="btn-label">Profile 🔒</span>
                <span class="btn-icon">👤</span>
              </a>
              <a class="btn btn-brand btn-sm navbar__cta" routerLink="/register" title="Register">
                <span class="btn-label">Start writing ✦</span>
                <span class="btn-icon">✍️</span>
              </a>
            </ng-template>

            <!-- Mobile hamburger -->
            <button class="navbar__hamburger"
                    [class.navbar__hamburger--open]="mobileOpen()"
                    (click)="toggleMobile()"
                    aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <!-- ══ MOBILE DRAWER ══ -->
      <div class="mobile-overlay"
           [class.mobile-overlay--open]="mobileOpen()"
           (click)="closeMobile()">
      </div>
      <div class="mobile-drawer" [class.mobile-drawer--open]="mobileOpen()">
        <div class="mobile-drawer__head">
          <div class="navbar__brand" style="cursor:default">
            <div class="navbar__logo">
              <span class="navbar__quill">✒</span>
            </div>
            <strong class="navbar__name">InkWell</strong>
          </div>
          <button class="btn-icon" (click)="closeMobile()">✕</button>
        </div>

        <nav class="mobile-drawer__nav">
          <a class="mobile-drawer__link" routerLink="/" (click)="closeMobile()">
            <span class="mobile-drawer__icon">🏠</span> Home
          </a>
          <a class="mobile-drawer__link" routerLink="/feed" (click)="closeMobile()">
            <span class="mobile-drawer__icon">🔍</span> Explore
          </a>
          <a class="mobile-drawer__link" routerLink="/pricing" (click)="closeMobile()">
            <span class="mobile-drawer__icon">💎</span> Pricing
          </a>
          <ng-container *ngIf="canWrite()">
            <a class="mobile-drawer__link" routerLink="/write" (click)="closeMobile()">
              <span class="mobile-drawer__icon">✍️</span> Write
            </a>
          </ng-container>
          <ng-container *ngIf="isAuthenticated()">
            <a *ngIf="canWrite()" class="mobile-drawer__link" [routerLink]="dashboardRoute()" (click)="closeMobile()">
              <span class="mobile-drawer__icon">📊</span> Dashboard
            </a>
            <a *ngIf="!canWrite()" class="mobile-drawer__link" routerLink="/become-author" (click)="closeMobile()">
              <span class="mobile-drawer__icon">🔒</span> Become Author
            </a>
            <a class="mobile-drawer__link" routerLink="/profile" (click)="closeMobile()">
              <span class="mobile-drawer__icon">👤</span> Profile
            </a>
            <button class="mobile-drawer__link mobile-drawer__link--danger" (click)="logout()">
              <span class="mobile-drawer__icon">⏻</span> Logout
            </button>
          </ng-container>
        </nav>

        <div class="mobile-drawer__foot" *ngIf="!isAuthenticated()">
          <a class="btn btn-ghost btn-full" routerLink="/login" (click)="closeMobile()">
            Log in
          </a>
          <a class="btn btn-brand btn-full" routerLink="/register" (click)="closeMobile()" style="margin-top:10px">
            Start writing free ✦
          </a>
        </div>
      </div>

      <!-- ══ PAGE CONTENT ══ -->
      <main class="shell__main">
        <router-outlet />
      </main>

    </div>
  `,
  styles: [`
    /* ── Shell wrapper ── */
    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .shell__main {
      flex: 1;
    }

    /* ════════════════════════════
       NAVBAR
    ════════════════════════════ */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 12px clamp(12px, 3vw, 24px);
    }

    .navbar__inner {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 10px 20px;
      background: var(--iw-surface);
      backdrop-filter: blur(24px) saturate(1.7);
      -webkit-backdrop-filter: blur(24px) saturate(1.7);
      border: 1px solid var(--iw-border);
      border-radius: 18px;
      box-shadow: var(--iw-glass-shadow);
      transition: all 0.3s ease;
    }

    .navbar--scrolled .navbar__inner {
      padding: 8px 20px;
      background: var(--iw-surface-strong);
      box-shadow: var(--iw-shadow-md);
    }

    /* Brand */
    .navbar__brand {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      text-decoration: none;
      flex-shrink: 0;
    }

    .navbar__logo {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      background: var(--iw-brand-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px var(--iw-brand-glow);
      transition: var(--trans-spring);
      flex-shrink: 0;
    }

    .navbar__brand:hover .navbar__logo {
      transform: rotate(-6deg) scale(1.08);
    }

    .navbar__quill {
      font-size: 1.1rem;
      color: white;
      line-height: 1;
    }

    .navbar__wordmark {
      display: flex;
      flex-direction: column;
      gap: 1px;
      line-height: 1;
    }

    .navbar__name {
      font-family: var(--font-display);
      font-size: 1.25rem;
      letter-spacing: -0.03em;
      font-weight: 600;
      color: var(--iw-ink);
      display: block;
    }

    .navbar__tagline {
      font-size: 0.68rem;
      color: var(--iw-muted);
      letter-spacing: 0.01em;
      display: block;
    }

    /* Nav links */
    .navbar__nav {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2px;
    }

    .navbar__link {
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--iw-muted);
      text-decoration: none;
      transition: var(--trans);
      position: relative;
    }

    .navbar__link:hover {
      color: var(--iw-ink);
      background: var(--iw-brand-soft);
    }

    .navbar__link--active {
      color: var(--iw-brand) !important;
      font-weight: 600;
    }

    .navbar__link--active::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 14px;
      right: 14px;
      height: 2px;
      background: var(--iw-brand-gradient);
      border-radius: 1px;
      animation: drawLine 0.25s ease forwards;
    }

    @keyframes drawLine {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }

    /* Actions */
    .navbar__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .navbar__ghost {
      border: 1px solid var(--iw-border);
      background: var(--iw-surface);
      color: var(--iw-ink-2);
    }
    
    .btn-icon { display: none; }

    @media (max-width: 800px) {
      .btn-label { display: none; }
      .btn-icon { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 1.15rem; 
        line-height: 1; 
      }
      .navbar__cta, .navbar__ghost { 
        padding: 0; 
        width: 38px; 
        height: 38px; 
        min-width: 38px;
        border-radius: 50%; 
        justify-content: center; 
        display: inline-flex;
        align-items: center;
      }
    }
    
    .navbar__ghost--locked, .navbar__cta--locked {
      opacity: 0.7;
      cursor: pointer;
    }
    
    .navbar__cta--locked {
      background: var(--iw-bg-alt) !important;
      color: var(--iw-muted) !important;
      border: 1px dashed var(--iw-border) !important;
      box-shadow: none !important;
    }

    /* Hamburger */
    .navbar__hamburger {
      display: none;
      flex-direction: column;
      gap: 4px;
      padding: 0;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      cursor: pointer;
      background: var(--iw-surface);
      border: 1px solid var(--iw-border);
      transition: var(--trans);
      align-items: center;
      justify-content: center;
    }

    .navbar__hamburger:hover {
      background: var(--iw-brand-soft);
      border-color: var(--iw-brand);
    }

    .navbar__hamburger span {
      display: block;
      width: 20px;
      height: 2px;
      background: var(--iw-ink);
      border-radius: 2px;
      transition: var(--trans);
      transform-origin: center;
    }

    .navbar__hamburger--open span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .navbar__hamburger--open span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }

    .navbar__hamburger--open span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }

    /* ════════════════════════════
       MOBILE DRAWER
    ════════════════════════════ */
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      transition: background 0.3s ease, backdrop-filter 0.3s ease;
      pointer-events: none;
    }

    .mobile-overlay--open {
      display: block;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      pointer-events: all;
    }

    .mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 201;
      width: min(300px, 85vw);
      background: var(--iw-bg-alt);
      border-left: 1px solid var(--iw-border);
      box-shadow: var(--iw-shadow-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 0;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mobile-drawer--open {
      transform: translateX(0);
    }

    .mobile-drawer__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--iw-border);
    }

    .mobile-drawer__nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .mobile-drawer__link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--iw-ink-2);
      text-decoration: none;
      transition: var(--trans);
    }

    .mobile-drawer__link:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-brand);
      padding-left: 18px;
    }

    .mobile-drawer__icon {
      font-size: 1.1rem;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .mobile-drawer__link--danger {
      margin-top: 10px;
      color: #ff4757;
      background: none;
      border: none;
      width: 100%;
      cursor: pointer;
    }
    
    .mobile-drawer__link--danger:hover {
      background: rgba(255, 71, 87, 0.1) !important;
      color: #ff4757 !important;
    }

    .mobile-drawer__foot {
      padding-top: 20px;
      border-top: 1px solid var(--iw-border);
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: auto;
    }

    /* ════════════════════════════
       RESPONSIVE
    ════════════════════════════ */
    @media (max-width: 960px) {
      .navbar__inner {
        grid-template-columns: auto 1fr auto;
      }

      .navbar__nav {
        display: none;
      }

      .navbar__hamburger {
        display: flex;
        order: 3;
      }
      
      .navbar__actions {
        gap: 4px;
      }
    }

    @media (max-width: 640px) {
      .navbar__wordmark {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .navbar {
        padding: 8px clamp(8px, 2vw, 16px);
      }

      .navbar__tagline {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShellComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);


  protected readonly isAuthenticated = computed(() => this.authSession.isAuthenticated());
  protected readonly dashboardRoute = computed(() => this.authSession.getPostLoginRedirectUrl());
  protected readonly canWrite = computed(() => {
    const role = this.authSession.role();
    return role === 'AUTHOR' || role === 'ADMIN';
  });

  protected readonly isScrolled = signal(false);
  protected readonly mobileOpen = signal(false);

  ngOnInit(): void {
    // Handled by HostListener
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled.set(window.scrollY > 20);
    }
  }


  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
    // Prevent body scroll when drawer is open
    document.body.style.overflow = this.mobileOpen() ? 'hidden' : '';
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
    document.body.style.overflow = '';
  }

  logout(): void {
    this.authSession.clearToken();
    this.closeMobile();
    window.location.href = '/login';
  }
}
