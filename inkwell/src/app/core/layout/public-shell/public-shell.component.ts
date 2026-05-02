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

      <!-- ══ FOOTER ══ -->
      <footer class="footer">
        <div class="footer__inner">
          <div class="footer__grid">
            
            <!-- Brand & Mission -->
            <div class="footer__col footer__col--brand">
              <a class="navbar__brand" routerLink="/" style="margin-bottom: 20px;">
                <div class="navbar__logo">
                  <span class="navbar__quill">✒</span>
                </div>
                <strong class="navbar__name">InkWell</strong>
              </a>
              <p class="footer__text">
                Elevating the world's most insightful stories. A home for deep thought, extraordinary writing, and ideas worth rereading.
              </p>
              <div class="footer__social">
                <a href="#" class="footer__social-link" aria-label="Twitter">𝕏</a>
                <a href="#" class="footer__social-link" aria-label="LinkedIn">in</a>
                <a href="#" class="footer__social-link" aria-label="Instagram">📸</a>
              </div>
            </div>

            <!-- Links -->
            <div class="footer__col">
              <h4 class="footer__title">Platform</h4>
              <nav class="footer__nav">
                <a routerLink="/" class="footer__link">Home</a>
                <a routerLink="/feed" class="footer__link">Explore</a>
                <a routerLink="/pricing" class="footer__link">Pricing</a>
                <a routerLink="/register" class="footer__link">Start Writing</a>
              </nav>
            </div>

            <!-- Support -->
            <div class="footer__col">
              <h4 class="footer__title">Community</h4>
              <nav class="footer__nav">
                <a href="#" (click)="openTerms('guidelines', $event)" class="footer__link">Guidelines</a>
                <a href="#" (click)="openTerms('partnerships', $event)" class="footer__link">Partnerships</a>
                <a href="#" (click)="openTerms('contact', $event)" class="footer__link">Contact</a>
                <a href="mailto:inkwellbloggingplatform@gmail.com" class="footer__link">Support</a>
              </nav>
            </div>

            <!-- Legal -->
            <div class="footer__col">
              <h4 class="footer__title">Legal</h4>
              <nav class="footer__nav">
                <a href="#" (click)="openTerms('tos', $event)" class="footer__link">Terms of Service</a>
                <a href="#" (click)="openTerms('privacy', $event)" class="footer__link">Privacy Policy</a>
                <a href="#" (click)="openTerms('cookies', $event)" class="footer__link">Cookie Policy</a>
              </nav>
            </div>

          </div>

          <div class="footer__bottom">
            <p class="footer__copy">© 2025 InkWell Media. Crafted with passion for the written word.</p>
            <div class="footer__status">
              <span class="status-dot"></span> All systems operational
            </div>
          </div>
        </div>
      </footer>

      <!-- ══ LEGAL / SUPPORT MODAL ══ -->
      <div class="terms-modal-overlay" *ngIf="showTermsModal()" (click)="closeTerms()" aria-modal="true" role="dialog">
        <div class="terms-modal" (click)="$event.stopPropagation()">
          <div class="terms-modal__head">
            <h2 class="terms-modal__title">
              <ng-container [ngSwitch]="termsType()">
                <span *ngSwitchCase="'tos'">Terms of Service</span>
                <span *ngSwitchCase="'privacy'">Privacy Policy</span>
                <span *ngSwitchCase="'cookies'">Cookie Policy</span>
                <span *ngSwitchCase="'guidelines'">Community Guidelines</span>
                <span *ngSwitchCase="'partnerships'">Partnerships</span>
                <span *ngSwitchCase="'contact'">Contact Us</span>
              </ng-container>
            </h2>
            <button class="terms-modal__close" (click)="closeTerms()" aria-label="Close" type="button">✕</button>
          </div>

          <div class="terms-modal__body">
            <ng-container [ngSwitch]="termsType()">
              <!-- TOS -->
              <div *ngSwitchCase="'tos'">
                <h3 class="legal-h3">1. Acceptance of Terms</h3>
                <p class="legal-p">By using InkWell, you agree to these terms. If you don't agree, please don't use our services.</p>
                <h3 class="legal-h3">2. Content Ownership</h3>
                <p class="legal-p">You own your words. By posting, you grant us a license to show them to the world on our platform.</p>
                <h3 class="legal-h3">3. Pro Subscriptions</h3>
                <p class="legal-p">Pro features are billed as described. You can cancel any time via your account settings.</p>
              </div>

              <!-- PRIVACY -->
              <div *ngSwitchCase="'privacy'">
                <h3 class="legal-h3">1. Data Collection</h3>
                <p class="legal-p">We collect basic info like email and profile data to make InkWell work for you.</p>
                <h3 class="legal-h3">2. Usage</h3>
                <p class="legal-p">Your data is used for personalization and security. We never sell your personal data.</p>
              </div>

              <!-- COOKIES -->
              <div *ngSwitchCase="'cookies'">
                <h3 class="legal-h3">Cookie Policy</h3>
                <p class="legal-p">We use essential cookies to keep you logged in and functional cookies to remember your preferences (like theme settings).</p>
                <p class="legal-p">By continuing to use InkWell, you consent to our use of these essential and functional cookies.</p>
              </div>

              <!-- GUIDELINES -->
              <div *ngSwitchCase="'guidelines'">
                <h3 class="legal-h3">Community Guidelines</h3>
                <p class="legal-p">1. Be respectful to other writers and readers.</p>
                <p class="legal-p">2. No plagiarism. Original content only.</p>
                <p class="legal-p">3. No hate speech or harassment.</p>
                <p class="legal-p">4. No spam or deceptive promotional content.</p>
              </div>

              <!-- PARTNERSHIPS -->
              <div *ngSwitchCase="'partnerships'">
                <h3 class="legal-h3">Build with us</h3>
                <p class="legal-p">We're always looking to partner with creative organizations and fellow technology platforms.</p>
                <p class="legal-p">Reach out to <strong>partners@inkwell.com</strong> to start a conversation.</p>
              </div>

              <!-- CONTACT -->
              <div *ngSwitchCase="'contact'">
                <h3 class="legal-h3">Get in touch</h3>
                <p class="legal-p">Have questions or feedback? We'd love to hear from you.</p>
                <p class="legal-p">General Inquiry: <strong>inkwellbloggingplatform@gmail.com</strong></p>
                <p class="legal-p">Social & Links: <a href="https://linktr.ee/harshvardhan3656" target="_blank" style="color: var(--iw-brand); font-weight: 600;">linktr.ee/harshvardhan3656</a></p>
              </div>
            </ng-container>
          </div>

          <div class="terms-modal__foot">
            <button class="btn btn-brand btn-full" (click)="closeTerms()" type="button">Close</button>
          </div>
        </div>
      </div>

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
       FOOTER
    ════════════════════════════ */
    .footer {
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
      padding: 60px 24px 30px;
      margin-top: 40px;
    }

    .footer__inner {
      max-width: 1200px;
      margin: 0 auto;
    }

    .footer__grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }

    .footer__col--brand {
      padding-right: 40px;
    }

    .footer__text {
      font-size: 0.94rem;
      color: var(--iw-muted);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .footer__title {
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--iw-ink);
      margin-bottom: 20px;
    }

    .footer__nav {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer__link {
      font-size: 0.9rem;
      color: var(--iw-muted);
      text-decoration: none;
      transition: var(--trans);
    }

    .footer__link:hover {
      color: var(--iw-brand);
      padding-left: 4px;
    }

    .footer__social {
      display: flex;
      gap: 12px;
    }

    .footer__social-link {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--iw-surface-solid);
      border: 1px solid var(--iw-border-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: var(--iw-muted);
      transition: var(--trans);
    }

    .footer__social-link:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-brand);
      border-color: var(--iw-brand);
      transform: translateY(-3px);
    }

    .footer__bottom {
      padding-top: 30px;
      border-top: 1px solid var(--iw-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer__copy {
      font-size: 0.82rem;
      color: var(--iw-faint);
    }

    .footer__status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--iw-emerald);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--iw-emerald);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--iw-emerald);
      animation: pulse-glow 2s infinite;
    }

    @media (max-width: 960px) {
      .footer__grid {
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
      .footer__col--brand {
        grid-column: span 2;
        padding-right: 0;
      }
    }

    @media (max-width: 500px) {
      .footer__grid {
        grid-template-columns: 1fr;
      }
      .footer__col--brand {
        grid-column: span 1;
      }
      .footer__bottom {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    /* ════════════════════════════
       RESPONSIVE
    ════════════════════════════ */
    /* ════════════════════════════
       MODAL (Legal & Support)
    ════════════════════════════ */
    .terms-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeInModal 0.3s ease both;
    }

    .terms-modal {
      width: 100%;
      max-width: 540px;
      background: var(--iw-bg);
      border: 1px solid var(--iw-border);
      border-radius: 20px;
      box-shadow: var(--iw-shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleInModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    .terms-modal__head {
      padding: 24px;
      border-bottom: 1px solid var(--iw-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--iw-bg-alt);
    }

    .terms-modal__title {
      margin: 0;
      font-size: 1.25rem;
      font-family: var(--font-display);
      color: var(--iw-ink);
    }

    .terms-modal__close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--iw-surface);
      border: 1px solid var(--iw-border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--iw-muted);
      cursor: pointer;
      transition: var(--trans);
    }

    .terms-modal__close:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-brand);
      border-color: var(--iw-brand);
    }

    .terms-modal__body {
      padding: 24px;
      max-height: 50vh;
      overflow-y: auto;
    }

    .legal-h3 { margin: 16px 0 8px; color: var(--iw-ink); font-size: 1.05rem; font-family: var(--font-display); }
    .legal-p { margin-bottom: 16px; color: var(--iw-muted); font-size: 0.92rem; line-height: 1.6; }

    .terms-modal__foot {
      padding: 20px 24px;
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
    }

    @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleInModal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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

  readonly showTermsModal = signal(false);
  readonly termsType = signal<'tos' | 'privacy' | 'cookies' | 'guidelines' | 'partnerships' | 'contact'>('tos');

  openTerms(type: 'tos' | 'privacy' | 'cookies' | 'guidelines' | 'partnerships' | 'contact', event?: Event) {
    event?.preventDefault();
    this.termsType.set(type);
    this.showTermsModal.set(true);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeTerms() {
    this.showTermsModal.set(false);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

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
