import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `

    <!-- ══════════════════════════════════════
         HERO SECTION
    ══════════════════════════════════════ -->
    <section class="hero">

      <!-- Ambient background orbs -->
      <div class="hero__orb hero__orb--1" aria-hidden="true"></div>
      <div class="hero__orb hero__orb--2" aria-hidden="true"></div>
      <div class="hero__orb hero__orb--3" aria-hidden="true"></div>

      <!-- Large watermark text -->
      <div class="hero__bg-word" aria-hidden="true">Write</div>

      <div class="hero__inner">

        <!-- Eyebrow pill -->
        <div class="hero__eyebrow animate-fade-up">
          <span class="hero__eyebrow-dot"></span>
          Now in public beta &nbsp;·&nbsp; 12,000+ writers worldwide
        </div>

        <!-- Main headline -->
        <h1 class="hero__title animate-fade-up delay-100">
          Where <em>ideas</em><br>become stories
        </h1>

        <!-- Sub headline -->
        <p class="hero__sub animate-fade-up delay-200">
          InkWell is a home for curious minds. Write beautifully,
          reach real readers, and build a following that lasts.
        </p>

        <!-- CTAs -->
        <div class="hero__actions animate-fade-up delay-300">
          <a routerLink="/register" class="btn btn-brand btn-lg hero__cta-primary">
            Start writing free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <a routerLink="/feed" class="btn btn-ghost btn-lg">
            Explore stories
          </a>
        </div>

        <!-- Stats bar -->
        <div class="hero__stats animate-fade-up delay-400">
          <div class="hero__stat" *ngFor="let s of stats; let i = index">
            <div class="hero__stat-num">{{ s.value }}</div>
            <div class="hero__stat-label">{{ s.label }}</div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══════════════════════════════════════
         EDITOR'S PICKS
    ══════════════════════════════════════ -->
    <section class="section picks-section" #revealSection>
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Editor's Picks</h2>
            <p class="section-subtitle">Handpicked stories worth your time</p>
          </div>
          <a class="see-all" routerLink="/feed">See all stories →</a>
        </div>

        <div class="picks-grid">

          <!-- Featured large card -->
          <a class="picks-card picks-card--featured" routerLink="/blog/quiet-art" #revealEl>
            <div class="picks-card__cover picks-card__cover--featured">
              <div class="picks-card__cover-inner">🌿</div>
              <div class="picks-card__cover-overlay"></div>
            </div>
            <div class="picks-card__body">
              <div class="picks-card__meta">
                <span class="tag">Philosophy</span>
                <span class="read-time">8 min read</span>
              </div>
              <h3 class="picks-card__title">
                The Quiet Art of Doing Nothing: A Meditation on Stillness in an Age of Noise
              </h3>
              <p class="picks-card__excerpt">
                We live in a civilization that worships productivity. Every idle moment is colonised by a
                notification, a podcast, a scroll. But what if stillness is not a luxury — it's a necessity?
              </p>
              <div class="picks-card__footer">
                <div class="avatar avatar-md" style="background: linear-gradient(135deg,#c9893a,#9a5f1a)">SR</div>
                <div>
                  <div style="font-size:0.82rem;font-weight:600;color:var(--iw-ink-2)">Shreya Rao</div>
                  <div style="font-size:0.76rem;color:var(--iw-faint)">Apr 18 · 2025</div>
                </div>
                <div class="picks-card__actions">
                  <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()" title="Bookmark">🔖</button>
                  <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()" title="Share">↗</button>
                </div>
              </div>
            </div>
          </a>

          <!-- Side card 1 -->
          <a class="picks-card" routerLink="/blog/ai-urban" #revealEl>
            <div class="picks-card__cover">
              <div class="picks-card__cover-inner" style="background:linear-gradient(135deg,rgba(61,100,216,0.08),var(--iw-bg-alt))">🏙️</div>
            </div>
            <div class="picks-card__body">
              <div class="picks-card__meta">
                <span class="tag">Technology</span>
                <span class="read-time">5 min read</span>
              </div>
              <h3 class="picks-card__title">How AI is Quietly Rewriting the Rules of Urban Planning</h3>
              <p class="picks-card__excerpt">From traffic flow to zoning laws, algorithms are increasingly making the decisions that shape our cities.</p>
              <div class="picks-card__footer">
                <div class="avatar avatar-md" style="background:linear-gradient(135deg,#3d78d8,#1a3a7a)">AK</div>
                <div>
                  <div style="font-size:0.82rem;font-weight:600;color:var(--iw-ink-2)">Arjun Kulkarni</div>
                  <div style="font-size:0.76rem;color:var(--iw-faint)">Apr 17</div>
                </div>
                <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()">🔖</button>
              </div>
            </div>
          </a>

          <!-- Side card 2 -->
          <a class="picks-card" routerLink="/blog/gen-z-craft" #revealEl>
            <div class="picks-card__cover">
              <div class="picks-card__cover-inner" style="background:linear-gradient(135deg,rgba(124,61,138,0.08),var(--iw-bg-alt))">🎨</div>
            </div>
            <div class="picks-card__body">
              <div class="picks-card__meta">
                <span class="tag">Culture</span>
                <span class="read-time">6 min read</span>
              </div>
              <h3 class="picks-card__title">The Renaissance of Handmade: Why Gen Z is Choosing Craft Over Code</h3>
              <p class="picks-card__excerpt">In a world of digital everything, a growing number of young people are turning to pottery, weaving, and woodwork as antidotes to screen fatigue.</p>
              <div class="picks-card__footer">
                <div class="avatar avatar-md" style="background:linear-gradient(135deg,#7c3d8a,#3d1a50)">PM</div>
                <div>
                  <div style="font-size:0.82rem;font-weight:600;color:var(--iw-ink-2)">Priya Mehta</div>
                  <div style="font-size:0.76rem;color:var(--iw-faint)">Apr 15</div>
                </div>
                <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()">🔖</button>
              </div>
            </div>
          </a>

        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         TOPICS STRIP
    ══════════════════════════════════════ -->
    <section class="topics-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Browse by Topic</h2>
        </div>
        <div class="topics-scroll">
          <a class="topic-pill" routerLink="/feed" *ngFor="let topic of topics">
            <span class="topic-pill__icon">{{ topic.icon }}</span>
            <span class="topic-pill__label">{{ topic.label }}</span>
            <span class="topic-pill__count">{{ topic.count }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         TRENDING THIS WEEK
    ══════════════════════════════════════ -->
    <section class="section trending-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Trending This Week</h2>
            <p class="section-subtitle">What the community is reading</p>
          </div>
          <a class="see-all" routerLink="/feed">View all →</a>
        </div>

        <div class="trending-layout">

          <!-- Numbered trending list -->
          <div class="trending-list">
            <a class="trending-item" routerLink="/blog/quiet-art"
               *ngFor="let post of trendingPosts; let i = index">
              <div class="trending-item__num">{{ (i + 1).toString().padStart(2, '0') }}</div>
              <div class="trending-item__body">
                <div class="trending-item__meta">
                  <span class="tag">{{ post.category }}</span>
                  <span class="read-time">{{ post.readTime }}</span>
                </div>
                <h3 class="trending-item__title">{{ post.title }}</h3>
                <div class="trending-item__footer">
                  <div class="avatar avatar-sm"
                    [style.background]="post.avatarGradient">{{ post.initials }}</div>
                  <span style="font-size:0.8rem;font-weight:600;color:var(--iw-ink-2)">{{ post.author }}</span>
                  <span style="font-size:0.76rem;color:var(--iw-faint)">{{ post.metric }}</span>
                </div>
              </div>
              <div class="trending-item__cover">
                <div class="trending-item__emoji">{{ post.emoji }}</div>
              </div>
            </a>
          </div>

          <!-- Right: writers to follow -->
          <div class="trending-sidebar">
            <div class="sidebar-widget">
              <div class="sidebar-widget__title">✦ Writers to Follow</div>
              <div class="writer-row" *ngFor="let w of suggestedWriters()">
                <div class="avatar avatar-md" [style.background]="w.gradient">{{ w.initials }}</div>
                <div class="writer-row__info">
                  <div class="writer-row__name">{{ w.name }}</div>
                  <div class="writer-row__bio">{{ w.bio }}</div>
                </div>
                <button class="follow-btn"
                        [class.follow-btn--following]="w.following"
                        (click)="toggleFollow(w)">
                  {{ w.following ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>

            <div class="sidebar-widget sidebar-widget--brand">
              <div class="sidebar-widget__title" style="color:rgba(255,255,255,0.6)">✒ Start writing today</div>
              <p style="font-size:0.875rem;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:16px">
                Share your ideas with thousands of readers who are hungry for authentic stories.
              </p>
              <a routerLink="/register" class="btn btn-white btn-full">
                Create free account →
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         CTA BAND
    ══════════════════════════════════════ -->
    <section class="cta-band">
      <div class="container">
        <div class="cta-band__inner">
          <div class="cta-band__text" aria-hidden="true">✍</div>
          <div class="cta-band__body">
            <h2 class="cta-band__title">Your story<br>deserves to be read</h2>
            <p class="cta-band__sub">Join thousands of writers sharing ideas that matter.</p>
          </div>
          <div class="cta-band__actions">
            <a routerLink="/register" class="btn btn-white btn-lg">
              <span>✒</span> Start writing free
            </a>
            <a routerLink="/pricing" class="cta-band__link">View pricing →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         FOOTER
    ══════════════════════════════════════ -->
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">

          <!-- Brand column -->
          <div class="footer__brand-col">
            <div class="footer__logo">
              <div class="footer__logo-icon">✒</div>
              <span class="footer__logo-name">InkWell</span>
            </div>
            <p class="footer__desc">
              A publishing platform built for writers who care about craft, clarity, and connection.
            </p>
            <div class="footer__socials">
              <a class="footer__social" href="#" title="Twitter / X" aria-label="Twitter">𝕏</a>
              <a class="footer__social" href="#" title="LinkedIn" aria-label="LinkedIn">in</a>
              <a class="footer__social" href="#" title="Instagram" aria-label="Instagram">◎</a>
            </div>
          </div>

          <!-- Product links -->
          <div class="footer__col">
            <div class="footer__col-title">Product</div>
            <a class="footer__link" routerLink="/feed">Explore</a>
            <a class="footer__link" routerLink="/write">Write</a>
            <a class="footer__link" routerLink="/pricing">Pricing</a>
            <a class="footer__link" href="#">Membership</a>
            <a class="footer__link" href="#">Newsletter</a>
          </div>

          <!-- Company links -->
          <div class="footer__col">
            <div class="footer__col-title">Company</div>
            <a class="footer__link" href="#">About</a>
            <a class="footer__link" href="#">Blog</a>
            <a class="footer__link" href="#">Careers</a>
            <a class="footer__link" href="#">Press</a>
          </div>

          <!-- Legal links -->
          <div class="footer__col">
            <div class="footer__col-title">Legal</div>
            <a class="footer__link" href="#">Privacy Policy</a>
            <a class="footer__link" href="#">Terms of Service</a>
            <a class="footer__link" href="#">Content Policy</a>
            <a class="footer__link" href="#">Cookie Settings</a>
          </div>
        </div>

        <div class="footer__bottom">
          <div class="footer__copy">© 2025 InkWell. Built for writers.</div>
          <div class="footer__legal-links">
            <a href="#" class="footer__legal-link">Privacy</a>
            <a href="#" class="footer__legal-link">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* ════════════════════════════════════
       HERO
    ════════════════════════════════════ */
    .hero {
      position: relative;
      min-height: calc(100vh - 90px);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: clamp(60px, 10vw, 120px) clamp(16px, 5vw, 80px);
    }

    /* Ambient glow orbs */
    .hero__orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(80px);
      opacity: 0.45;
    }

    .hero__orb--1 {
      width: clamp(300px, 45vw, 600px);
      height: clamp(300px, 45vw, 600px);
      top: -15%;
      left: -10%;
      background: radial-gradient(circle, rgba(201,137,58,0.18), transparent 70%);
      animation: float 8s ease-in-out infinite;
    }

    .hero__orb--2 {
      width: clamp(200px, 35vw, 450px);
      height: clamp(200px, 35vw, 450px);
      bottom: 5%;
      right: -8%;
      background: radial-gradient(circle, rgba(42,138,106,0.12), transparent 70%);
      animation: float 11s ease-in-out infinite reverse;
    }

    .hero__orb--3 {
      width: clamp(150px, 25vw, 300px);
      height: clamp(150px, 25vw, 300px);
      top: 30%;
      right: 15%;
      background: radial-gradient(circle, rgba(201,137,58,0.08), transparent 70%);
      animation: float 14s ease-in-out infinite 2s;
    }

    /* Big watermark word */
    .hero__bg-word {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: var(--font-display);
      font-size: clamp(120px, 22vw, 320px);
      font-weight: 600;
      color: transparent;
      -webkit-text-stroke: 1px rgba(120, 80, 30, 0.055);
      letter-spacing: -0.07em;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      z-index: 0;
    }

    .hero__inner {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 860px;
      width: 100%;
    }

    /* Eyebrow pill */
    .hero__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 18px;
      background: var(--iw-surface-strong);
      backdrop-filter: blur(10px);
      border: 1px solid var(--iw-border);
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--iw-brand);
      letter-spacing: 0.02em;
      margin-bottom: 28px;
      box-shadow: var(--iw-shadow-sm);
    }

    .hero__eyebrow-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--iw-brand);
      box-shadow: 0 0 0 3px var(--iw-brand-soft);
      animation: pulse-glow 2.2s ease-in-out infinite;
      flex-shrink: 0;
    }

    /* Headline */
    .hero__title {
      font-family: var(--font-display);
      font-size: clamp(52px, 9vw, 112px);
      font-weight: 500;
      line-height: 0.95;
      letter-spacing: -0.045em;
      color: var(--iw-ink);
      margin-bottom: 24px;
    }

    .hero__title em {
      font-style: italic;
      color: var(--iw-brand);
    }

    /* Sub */
    .hero__sub {
      font-family: var(--font-prose);
      font-size: clamp(17px, 2.2vw, 22px);
      font-weight: 400;
      color: var(--iw-muted);
      max-width: 540px;
      margin: 0 auto 40px;
      line-height: 1.6;
    }

    /* Actions */
    .hero__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 52px;
    }

    .hero__cta-primary {
      font-size: 1rem;
      padding: 15px 32px;
    }

    /* Stats */
    .hero__stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding-top: 36px;
      border-top: 1px solid var(--iw-border);
      flex-wrap: wrap;
    }

    .hero__stat {
      text-align: center;
      padding: 0 clamp(20px, 4vw, 48px);
      border-right: 1px solid var(--iw-border);
    }

    .hero__stat:last-child {
      border-right: none;
    }

    .hero__stat-num {
      font-family: var(--font-display);
      font-size: clamp(1.6rem, 3vw, 2.4rem);
      letter-spacing: -0.05em;
      color: var(--iw-ink);
      line-height: 1;
    }

    .hero__stat-label {
      font-size: 0.76rem;
      color: var(--iw-muted);
      margin-top: 4px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* ════════════════════════════════════
       PICKS SECTION
    ════════════════════════════════════ */
    .picks-section {
      padding: clamp(56px, 8vw, 100px) 0;
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
      border-bottom: 1px solid var(--iw-border);
    }

    .picks-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 20px;
    }

    /* Card shared */
    .picks-card {
      display: flex;
      flex-direction: column;
      background: var(--iw-surface);
      backdrop-filter: blur(14px) saturate(1.5);
      -webkit-backdrop-filter: blur(14px) saturate(1.5);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: var(--trans);
      box-shadow: var(--iw-shadow-sm);
      cursor: pointer;
    }

    .picks-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--iw-shadow-md);
      border-color: var(--iw-border-2);
    }

    /* Featured card */
    .picks-card--featured {
      grid-row: span 2;
    }

    .picks-card__cover {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
    }

    .picks-card--featured .picks-card__cover {
      aspect-ratio: 4 / 3;
    }

    .picks-card__cover-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(2rem, 4vw, 3.5rem);
      background: linear-gradient(135deg, var(--iw-brand-soft), var(--iw-bg-alt));
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .picks-card:hover .picks-card__cover-inner {
      transform: scale(1.06);
    }

    .picks-card__cover-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(20, 10, 0, 0.12), transparent 50%);
      pointer-events: none;
    }

    .picks-card__body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .picks-card__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .picks-card__title {
      font-family: var(--font-display);
      font-size: 1.18rem;
      letter-spacing: -0.025em;
      line-height: 1.28;
      color: var(--iw-ink);
      margin-bottom: 10px;
      transition: color 0.18s ease;
    }

    .picks-card--featured .picks-card__title {
      font-size: 1.55rem;
    }

    .picks-card:hover .picks-card__title {
      color: var(--iw-brand);
    }

    .picks-card__excerpt {
      font-size: 0.875rem;
      color: var(--iw-muted);
      line-height: 1.65;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .picks-card--featured .picks-card__excerpt {
      -webkit-line-clamp: 3;
    }

    .picks-card__footer {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--iw-border);
    }

    .picks-card__actions {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }

    .btn-icon--sm {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: none;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      color: var(--iw-muted);
      cursor: pointer;
      transition: var(--trans);
    }

    .btn-icon--sm:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-brand);
    }

    /* Scroll-reveal: cards fade up when entering viewport */
    .picks-card {
      opacity: 0;
      transform: translateY(24px);
      transition:
        opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.55s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.22s ease,
        border-color 0.22s ease;
    }

    .picks-card.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ════════════════════════════════════
       TOPICS
    ════════════════════════════════════ */
    .topics-section {
      padding: clamp(48px, 7vw, 80px) 0;
    }

    .topics-scroll {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .topic-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 18px;
      border-radius: 999px;
      background: var(--iw-surface);
      backdrop-filter: blur(8px);
      border: 1px solid var(--iw-border);
      text-decoration: none;
      color: var(--iw-ink-2);
      font-size: 0.875rem;
      font-weight: 500;
      transition: var(--trans-spring);
      cursor: pointer;
      white-space: nowrap;
    }

    .topic-pill:hover {
      background: var(--iw-brand-soft);
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      transform: translateY(-3px);
      box-shadow: var(--iw-shadow-sm);
    }

    .topic-pill__icon {
      font-size: 1.05rem;
      line-height: 1;
    }

    .topic-pill__label {
      font-weight: 600;
    }

    .topic-pill__count {
      font-size: 0.72rem;
      color: var(--iw-faint);
      background: var(--iw-bg-alt);
      padding: 2px 7px;
      border-radius: 999px;
      font-weight: 600;
    }

    /* ════════════════════════════════════
       TRENDING SECTION
    ════════════════════════════════════ */
    .trending-section {
      padding: clamp(56px, 8vw, 96px) 0;
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
    }

    .trending-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 32px;
      align-items: start;
    }

    /* Trending list */
    .trending-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .trending-item {
      display: grid;
      grid-template-columns: 56px 1fr 100px;
      gap: 16px;
      align-items: start;
      padding: 20px 0;
      border-bottom: 1px solid var(--iw-border);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: var(--trans);
    }

    .trending-item:first-child {
      padding-top: 0;
    }

    .trending-item:last-child {
      border-bottom: none;
    }

    .trending-item:hover .trending-item__title {
      color: var(--iw-brand);
    }

    .trending-item:hover .trending-item__num {
      color: var(--iw-brand);
    }

    .trending-item__num {
      font-family: var(--font-display);
      font-size: 2.2rem;
      letter-spacing: -0.06em;
      line-height: 1;
      color: var(--iw-faint);
      padding-top: 2px;
      transition: color 0.2s ease;
    }

    .trending-item__body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .trending-item__meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trending-item__title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      letter-spacing: -0.025em;
      line-height: 1.3;
      color: var(--iw-ink);
      transition: color 0.2s ease;
    }

    .trending-item__footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .trending-item__cover {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 2px;
    }

    .trending-item__emoji {
      width: 80px;
      height: 60px;
      border-radius: var(--r-md);
      background: linear-gradient(135deg, var(--iw-brand-soft), var(--iw-bg-deep));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      border: 1px solid var(--iw-border);
      flex-shrink: 0;
    }

    /* Sidebar widgets */
    .trending-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 100px;
    }

    .sidebar-widget {
      background: var(--iw-surface);
      backdrop-filter: blur(14px) saturate(1.5);
      -webkit-backdrop-filter: blur(14px) saturate(1.5);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      padding: 20px;
      box-shadow: var(--iw-shadow-sm);
    }

    .sidebar-widget--brand {
      background: var(--iw-brand-gradient);
      border-color: transparent;
    }

    .sidebar-widget__title {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--iw-faint);
      margin-bottom: 14px;
    }

    .writer-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--iw-border);
    }

    .writer-row:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }

    .writer-row__info {
      flex: 1;
      min-width: 0;
    }

    .writer-row__name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--iw-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .writer-row__bio {
      font-size: 0.76rem;
      color: var(--iw-muted);
    }

    .follow-btn {
      flex-shrink: 0;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
      border: 1.5px solid var(--iw-brand);
      color: var(--iw-brand);
      background: transparent;
      cursor: pointer;
      transition: var(--trans);
      white-space: nowrap;
    }

    .follow-btn:hover {
      background: var(--iw-brand);
      color: white;
    }

    .follow-btn--following {
      background: var(--iw-brand-soft);
    }

    /* ════════════════════════════════════
       CTA BAND
    ════════════════════════════════════ */
    .cta-band {
      padding: clamp(24px, 4vw, 48px) 0 clamp(56px, 8vw, 96px);
    }

    .cta-band__inner {
      background: var(--iw-brand-gradient);
      border-radius: var(--r-2xl);
      padding: clamp(48px, 6vw, 72px) clamp(24px, 6vw, 72px);
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 32px;
      position: relative;
      overflow: hidden;
    }

    .cta-band__text {
      position: absolute;
      right: clamp(24px, 5vw, 72px);
      top: 50%;
      transform: translateY(-50%);
      font-size: clamp(80px, 12vw, 140px);
      opacity: 0.10;
      pointer-events: none;
      line-height: 1;
      user-select: none;
    }

    /* Shine sweep on hover */
    .cta-band__inner::before {
      content: '';
      position: absolute;
      top: 0; left: -100%; bottom: 0;
      width: 60%;
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(255,255,255,0.10) 50%,
        transparent 70%
      );
      transition: left 0.7s ease;
    }

    .cta-band:hover .cta-band__inner::before {
      left: 150%;
    }

    .cta-band__body {
      position: relative;
      z-index: 1;
    }

    .cta-band__title {
      font-family: var(--font-display);
      font-size: clamp(30px, 4.5vw, 52px);
      letter-spacing: -0.04em;
      line-height: 1.05;
      color: white;
    }

    .cta-band__sub {
      color: rgba(255, 255, 255, 0.75);
      margin-top: 10px;
      font-size: 1rem;
    }

    .cta-band__actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .cta-band__link {
      color: rgba(255, 255, 255, 0.70);
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .cta-band__link:hover {
      color: white;
    }

    /* ════════════════════════════════════
       FOOTER
    ════════════════════════════════════ */
    .footer {
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
      padding: clamp(48px, 6vw, 72px) 0 clamp(24px, 4vw, 40px);
    }

    .footer__grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .footer__logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .footer__logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--iw-brand-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: white;
      box-shadow: 0 4px 12px var(--iw-brand-glow);
    }

    .footer__logo-name {
      font-family: var(--font-display);
      font-size: 1.3rem;
      letter-spacing: -0.03em;
      color: var(--iw-ink);
    }

    .footer__desc {
      font-size: 0.875rem;
      color: var(--iw-muted);
      line-height: 1.7;
      max-width: 260px;
      margin-bottom: 20px;
    }

    .footer__socials {
      display: flex;
      gap: 8px;
    }

    .footer__social {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid var(--iw-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.88rem;
      color: var(--iw-muted);
      text-decoration: none;
      transition: var(--trans);
    }

    .footer__social:hover {
      color: var(--iw-brand);
      border-color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .footer__col-title {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: var(--iw-ink-2);
      margin-bottom: 16px;
    }

    .footer__link {
      display: block;
      font-size: 0.875rem;
      color: var(--iw-muted);
      text-decoration: none;
      margin-bottom: 10px;
      transition: var(--trans);
    }

    .footer__link:hover {
      color: var(--iw-brand);
      padding-left: 4px;
    }

    .footer__bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 24px;
      border-top: 1px solid var(--iw-border);
      gap: 12px;
      flex-wrap: wrap;
    }

    .footer__copy {
      font-size: 0.8rem;
      color: var(--iw-faint);
    }

    .footer__legal-links {
      display: flex;
      gap: 16px;
    }

    .footer__legal-link {
      font-size: 0.8rem;
      color: var(--iw-faint);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer__legal-link:hover {
      color: var(--iw-brand);
    }

    /* ════════════════════════════════════
       RESPONSIVE
    ════════════════════════════════════ */
    @media (max-width: 1024px) {
      .picks-grid {
        grid-template-columns: 1fr 1fr;
      }

      .picks-card--featured {
        grid-column: span 2;
        grid-row: span 1;
        flex-direction: row;
      }

      .picks-card--featured .picks-card__cover {
        width: 240px;
        aspect-ratio: auto;
        flex-shrink: 0;
      }

      .trending-layout {
        grid-template-columns: 1fr;
      }

      .trending-sidebar {
        position: static;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .footer__grid {
        grid-template-columns: 1fr 1fr;
      }

      .cta-band__inner {
        grid-template-columns: 1fr;
      }

      .cta-band__actions {
        align-items: flex-start;
      }

      .cta-band__text {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .picks-grid {
        grid-template-columns: 1fr;
      }

      .picks-card--featured {
        grid-column: span 1;
        flex-direction: column;
      }

      .picks-card--featured .picks-card__cover {
        width: 100%;
        aspect-ratio: 16/9;
      }

      .trending-item {
        grid-template-columns: 44px 1fr;
      }

      .trending-item__cover {
        display: none;
      }

      .trending-sidebar {
        grid-template-columns: 1fr;
      }

      .hero__stat {
        border-right: none;
        border-bottom: 1px solid var(--iw-border);
        padding: 16px 0;
        width: 100%;
      }

      .hero__stat:last-child {
        border-bottom: none;
      }

      .hero__stats {
        flex-direction: column;
        gap: 0;
      }

      .footer__grid {
        grid-template-columns: 1fr;
        gap: 28px;
      }

      .topics-scroll {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
        scrollbar-width: none;
      }

      .topics-scroll::-webkit-scrollbar {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .hero__actions {
        flex-direction: column;
        width: 100%;
      }

      .hero__cta-primary,
      .hero__actions .btn-ghost {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class HomePageComponent {
  private readonly zone = inject(NgZone);

  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  @ViewChildren('revealEl') revealEls!: QueryList<ElementRef<HTMLElement>>;

  protected readonly stats = [
    { value: '2.4M', label: 'Monthly Readers' },
    { value: '48K',  label: 'Published Stories' },
    { value: '12K',  label: 'Active Writers' },
    { value: '97%',  label: 'Uptime' },
  ];

  protected readonly topics = [
    { icon: '✍️', label: 'Writing',     count: '3.2k' },
    { icon: '💡', label: 'Philosophy',  count: '1.8k' },
    { icon: '🚀', label: 'Technology',  count: '5.1k' },
    { icon: '🌍', label: 'Culture',     count: '2.4k' },
    { icon: '🧪', label: 'Science',     count: '1.5k' },
    { icon: '🎭', label: 'Fiction',     count: '920' },
    { icon: '🌿', label: 'Wellness',    count: '2.9k' },
    { icon: '📈', label: 'Business',    count: '4.0k' },
    { icon: '🎨', label: 'Design',      count: '1.1k' },
    { icon: '🏛️', label: 'History',     count: '840' },
    { icon: '🍃', label: 'Environment', count: '630' },
    { icon: '🧠', label: 'Psychology',  count: '1.3k' },
    { icon: '📚', label: 'Books',       count: '2.0k' },
    { icon: '✈️', label: 'Travel',      count: '1.7k' },
    { icon: '🎵', label: 'Music',       count: '750' },
    { icon: '🍜', label: 'Food',        count: '1.2k' },
  ];

  protected readonly trendingPosts = [
    {
      category: 'Wellness',
      readTime: '4 min',
      title: 'I Quit Social Media for 90 Days — Here\'s What Actually Changed',
      author: 'Nandita K.',
      initials: 'NK',
      avatarGradient: 'linear-gradient(135deg,#2a8a6a,#0f3d28)',
      metric: '512 claps',
      emoji: '🧘',
    },
    {
      category: 'Business',
      readTime: '7 min',
      title: 'The Silent Collapse of the Middle Manager',
      author: 'Rahul Verma',
      initials: 'RV',
      avatarGradient: 'linear-gradient(135deg,#8a3d2a,#4a1a10)',
      metric: '391 claps',
      emoji: '⚡',
    },
    {
      category: 'Science',
      readTime: '9 min',
      title: 'We\'ve Been Wrong About Dark Matter. New Evidence Rewrites Cosmology',
      author: 'Dr. Divya S.',
      initials: 'DS',
      avatarGradient: 'linear-gradient(135deg,#2a4a8a,#0f1e50)',
      metric: '274 claps',
      emoji: '🌌',
    },
    {
      category: 'Culture',
      readTime: '6 min',
      title: 'The Renaissance of Handmade: Why Gen Z is Choosing Craft Over Code',
      author: 'Priya Mehta',
      initials: 'PM',
      avatarGradient: 'linear-gradient(135deg,#7c3d8a,#3d1a50)',
      metric: '218 claps',
      emoji: '🎨',
    },
    {
      category: 'Philosophy',
      readTime: '8 min',
      title: 'The Quiet Art of Doing Nothing',
      author: 'Shreya Rao',
      initials: 'SR',
      avatarGradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)',
      metric: '248 claps',
      emoji: '🌿',
    },
  ];

  protected readonly suggestedWriters = signal([
    { name: 'Priya Mehta',    initials: 'PM', bio: 'Culture & Design',  gradient: 'linear-gradient(135deg,#7c3d8a,#3d1a50)', following: false },
    { name: 'Jatin Kumar',    initials: 'JK', bio: 'Tech & Society',    gradient: 'linear-gradient(135deg,#2a8a6a,#0f3d28)', following: false },
    { name: 'Ananya Lal',     initials: 'AL', bio: 'Fiction & Poetry',  gradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)', following: false },
    { name: 'Siddharth M.',   initials: 'SM', bio: 'Philosophy',        gradient: 'linear-gradient(135deg,#3d78d8,#1a3a7a)', following: false },
  ]);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      try {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const el = entry.target as HTMLElement;
                const delay = Array.from(
                  el.parentElement?.querySelectorAll('.picks-card') ?? []
                ).indexOf(el) * 80;

                setTimeout(() => {
                  this.zone.run(() => el.classList.add('is-visible'));
                }, delay);

                this.observer?.unobserve(el);
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        // Observe after Angular renders
        setTimeout(() => {
          this.revealEls?.forEach(ref => {
            this.observer?.observe(ref.nativeElement);
          });
        }, 50);
      } catch (e) {
        console.error('IntersectionObserver initialization failed:', e);
      }
    });
  }


  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  toggleFollow(writer: { name: string; following: boolean; [key: string]: unknown }): void {
    this.suggestedWriters.update(list =>
      list.map(w => w.name === writer.name ? { ...w, following: !w.following } : w)
    );
  }
}