import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- ══════════════════════════════════════
         HERO SECTION
    ══════════════════════════════════════ -->
    <section class="hero">
      <div class="hero__orb hero__orb--1" aria-hidden="true"></div>
      <div class="hero__orb hero__orb--2" aria-hidden="true"></div>
      <div class="hero__orb hero__orb--3" aria-hidden="true"></div>
      <div class="hero__bg-word" aria-hidden="true">Write</div>

      <div class="hero__inner">
        <div class="hero__eyebrow animate-fade-up">
          <span class="hero__eyebrow-dot"></span>
          Now in public beta &nbsp;·&nbsp; 12,000+ writers worldwide
        </div>
        <h1 class="hero__title animate-fade-up delay-100">
          Where <em>ideas</em><br>become stories
        </h1>
        <p class="hero__sub animate-fade-up delay-200">
          InkWell is a home for curious minds. Write beautifully,
          reach real readers, and build a following that lasts.
        </p>
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

        <div class="picks-grid" *ngIf="picks().length > 0; else picksShimmer">
          <!-- Featured large card -->
          <a class="picks-card picks-card--featured" [routerLink]="['/blog', picks()[0].id]" #revealEl>
            <div class="picks-card__cover picks-card__cover--featured">
              <div class="picks-card__cover-inner">{{ picks()[0].coverEmoji }}</div>
              <div class="picks-card__cover-overlay"></div>
            </div>
            <div class="picks-card__body">
              <div class="picks-card__meta">
                <span class="tag">{{ picks()[0].category }}</span>
                <span class="read-time">{{ picks()[0].readTime }} min read</span>
              </div>
              <h3 class="picks-card__title">{{ picks()[0].title }}</h3>
              <p class="picks-card__excerpt">{{ picks()[0].excerpt || 'Click to read this insightful story on InkWell.' }}</p>
              <div class="picks-card__footer">
                <div class="avatar avatar-md" [style.background]="picks()[0].authorGradient">{{ picks()[0].initials }}</div>
                <div>
                  <div style="font-size:0.82rem;font-weight:600;color:var(--iw-ink-2)">{{ picks()[0].authorName }}</div>
                  <div style="font-size:0.76rem;color:var(--iw-faint)">{{ picks()[0].displayDate }}</div>
                </div>
                <div class="picks-card__actions">
                  <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()">🔖</button>
                  <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()">↗</button>
                </div>
              </div>
            </div>
          </a>

          <!-- Other picks -->
          <ng-container *ngFor="let post of picks().slice(1, 3)">
            <a class="picks-card" [routerLink]="['/blog', post.id]" #revealEl>
              <div class="picks-card__cover">
                <div class="picks-card__cover-inner">{{ post.coverEmoji }}</div>
              </div>
              <div class="picks-card__body">
                <div class="picks-card__meta">
                  <span class="tag">{{ post.category }}</span>
                  <span class="read-time">{{ post.readTime }} min</span>
                </div>
                <h3 class="picks-card__title">{{ post.title }}</h3>
                <p class="picks-card__excerpt">{{ post.excerpt }}</p>
                <div class="picks-card__footer">
                  <div class="avatar avatar-md" [style.background]="post.authorGradient">{{ post.initials }}</div>
                  <div>
                    <div style="font-size:0.82rem;font-weight:600;color:var(--iw-ink-2)">{{ post.authorName }}</div>
                    <div style="font-size:0.76rem;color:var(--iw-faint)">{{ post.displayDate }}</div>
                  </div>
                  <button class="btn-icon btn-icon--sm" (click)="$event.preventDefault()">🔖</button>
                </div>
              </div>
            </a>
          </ng-container>
        </div>

        <ng-template #picksShimmer>
           <div class="picks-grid">
              <div class="picks-card picks-card--featured shimmer-card" style="height: 400px; background: #eee;"></div>
              <div class="picks-card shimmer-card" style="height: 400px; background: #eee;"></div>
              <div class="picks-card shimmer-card" style="height: 400px; background: #eee;"></div>
           </div>
        </ng-template>
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
          <div class="trending-list" *ngIf="trending().length > 0; else trendingShimmer">
            <a class="trending-item" [routerLink]="['/blog', post.id]"
               *ngFor="let post of trending(); let i = index">
              <div class="trending-item__num">{{ (i + 1).toString().padStart(2, '0') }}</div>
              <div class="trending-item__body">
                <div class="trending-item__meta">
                  <span class="tag">{{ post.category }}</span>
                  <span class="read-time">{{ post.readTime }} min</span>
                </div>
                <h3 class="trending-item__title">{{ post.title }}</h3>
                <div class="trending-item__footer">
                  <div class="avatar avatar-sm" [style.background]="post.authorGradient">{{ post.initials }}</div>
                  <span style="font-size:0.8rem;font-weight:600;color:var(--iw-ink-2)">{{ post.authorName }}</span>
                  <span style="font-size:0.76rem;color:var(--iw-faint)">{{ post.viewCount }} views</span>
                </div>
              </div>
              <div class="trending-item__cover">
                <div class="trending-item__emoji">{{ post.coverEmoji }}</div>
              </div>
            </a>
          </div>

          <ng-template #trendingShimmer>
             <div class="trending-list">
                <div class="trending-item" *ngFor="let n of [1,2,3,4,5]" style="height: 100px; border-bottom: 1px solid #eee; background: #fafafa;"></div>
             </div>
          </ng-template>

          <div class="trending-sidebar">
            <div class="sidebar-widget">
              <div class="sidebar-widget__title">✦ Writers to Follow</div>
              <div class="writer-row" *ngFor="let w of suggestedWriters()">
                <div class="avatar avatar-md" [style.background]="w.gradient">{{ w.initials }}</div>
                <div class="writer-row__info">
                  <div class="writer-row__name">{{ w.name }}</div>
                  <div class="writer-row__bio">{{ w.bio }}</div>
                </div>
                <button class="follow-btn" [class.follow-btn--following]="w.following" (click)="toggleFollow(w)">
                  {{ w.following ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>

            <div class="sidebar-widget sidebar-widget--brand">
              <div class="sidebar-widget__title" style="color:rgba(255,255,255,0.6)">✒ Start writing today</div>
              <p style="font-size:0.875rem;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:16px">
                Share your ideas with thousands of readers who are hungry for authentic stories.
              </p>
              <a routerLink="/register" class="btn btn-white btn-full">Create free account →</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div class="container">
        <div class="cta-band__inner">
          <div class="cta-band__text" aria-hidden="true">✍</div>
          <div class="cta-band__body">
            <h2 class="cta-band__title">Your story<br>deserves to be read</h2>
            <p class="cta-band__sub">Join thousands of writers sharing ideas that matter.</p>
          </div>
          <div class="cta-band__actions">
            <a routerLink="/register" class="btn btn-white btn-lg"><span>✒</span> Start writing free</a>
            <a routerLink="/pricing" class="cta-band__link">View pricing →</a>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand-col">
            <div class="footer__logo">
              <div class="footer__logo-icon">✒</div>
              <span class="footer__logo-name">InkWell</span>
            </div>
            <p class="footer__desc">A publishing platform built for writers who care about craft, clarity, and connection.</p>
          </div>
          <div class="footer__col">
            <div class="footer__col-title">Product</div>
            <a class="footer__link" routerLink="/feed">Explore</a>
            <a class="footer__link" routerLink="/write">Write</a>
            <a class="footer__link" routerLink="/pricing">Pricing</a>
          </div>
          <div class="footer__col">
            <div class="footer__col-title">Company</div>
            <a class="footer__link" href="#">About</a>
            <a class="footer__link" href="#">Blog</a>
          </div>
          <div class="footer__col">
            <div class="footer__col-title">Legal</div>
            <a class="footer__link" href="#">Privacy</a>
            <a class="footer__link" href="#">Terms</a>
          </div>
        </div>
        <div class="footer__bottom">
          <div class="footer__copy">© 2025 InkWell. Built for writers.</div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    .hero { position: relative; min-height: 80vh; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 80px 20px; background: var(--iw-bg); }
    .hero__orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
    .hero__orb--1 { width: 400px; height: 400px; top: -10%; left: -5%; background: radial-gradient(circle, var(--iw-brand), transparent); }
    .hero__orb--2 { width: 300px; height: 300px; bottom: 10%; right: -5%; background: radial-gradient(circle, var(--iw-emerald), transparent); }
    .hero__bg-word { position: absolute; font-family: var(--font-display); font-size: 20vw; color: var(--iw-ink); opacity: 0.03; z-index: 0; white-space: nowrap; }
    .hero__inner { position: relative; z-index: 1; text-align: center; max-width: 800px; }
    .hero__eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--iw-surface-strong); border: 1px solid var(--iw-border); border-radius: 100px; font-size: 0.8rem; margin-bottom: 24px; color: var(--iw-muted); }
    .hero__eyebrow-dot { width: 8px; height: 8px; background: var(--iw-brand); border-radius: 50%; }
    .hero__title { font-family: var(--font-display); font-size: clamp(3rem, 8vw, 6rem); line-height: 1; margin-bottom: 24px; color: var(--iw-ink); }
    .hero__title em { font-style: italic; color: var(--iw-brand); }
    .hero__sub { font-size: 1.25rem; color: var(--iw-muted); margin-bottom: 40px; }
    .hero__actions { display: flex; gap: 16px; justify-content: center; margin-bottom: 48px; }
    .hero__stats { display: flex; gap: 40px; justify-content: center; border-top: 1px solid var(--iw-border); padding-top: 32px; }
    .hero__stat-num { font-family: var(--font-display); font-size: 2rem; color: var(--iw-ink); }
    .hero__stat-label { font-size: 0.75rem; color: var(--iw-faint); text-transform: uppercase; }

    .picks-section { padding: 80px 0; background: var(--iw-bg-alt); }
    .picks-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 24px; }
    .picks-card { background: var(--iw-surface-solid); border: 1px solid var(--iw-border); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: transform 0.2s; display: flex; flex-direction: column; }
    .picks-card:hover { transform: translateY(-4px); border-color: var(--iw-brand); box-shadow: var(--iw-shadow-md); }
    .picks-card--featured { grid-row: span 2; }
    .picks-card__cover { aspect-ratio: 16/9; background: var(--iw-bg-deep); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
    .picks-card__body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
    .picks-card__title { font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 12px; color: var(--iw-ink); }
    .picks-card__excerpt { color: var(--iw-muted); font-size: 0.95rem; line-height: 1.6; }
    .picks-card__footer { display: flex; align-items: center; gap: 12px; margin-top: auto; border-top: 1px solid var(--iw-border); padding-top: 16px; }

    .topics-section { padding: 64px 0; background: var(--iw-bg); }
    .topics-scroll { display: flex; gap: 12px; flex-wrap: wrap; }
    .topic-pill { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--iw-surface-solid); border: 1px solid var(--iw-border); border-radius: 100px; text-decoration: none; color: var(--iw-ink-2); font-weight: 600; transition: 0.2s; }
    .topic-pill:hover { border-color: var(--iw-brand); color: var(--iw-brand); background: var(--iw-brand-soft); }
    .topic-pill__count { font-size: 0.75rem; color: var(--iw-faint); }

    .trending-section { padding: 80px 0; background: var(--iw-bg-alt); }
    .trending-layout { display: grid; grid-template-columns: 1fr 320px; gap: 48px; }
    .trending-item { display: grid; grid-template-columns: 48px 1fr 80px; gap: 16px; padding: 24px 0; border-bottom: 1px solid var(--iw-border); text-decoration: none; color: inherit; }
    .trending-item__num { font-size: 2rem; color: var(--iw-faint); font-family: var(--font-display); opacity: 0.5; }
    .trending-item__title { font-family: var(--font-display); font-size: 1.1rem; color: var(--iw-ink); }
    .trending-item__emoji { width: 60px; height: 60px; background: var(--iw-bg-deep); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }

    .trending-sidebar { display: flex; flex-direction: column; gap: 24px; }
    .sidebar-widget { background: var(--iw-surface-solid); border: 1px solid var(--iw-border); border-radius: 20px; padding: 24px; }
    .sidebar-widget__title { font-size: 0.9rem; font-weight: 700; color: var(--iw-ink-2); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
    .sidebar-widget--brand { background: var(--iw-brand-gradient); color: #fff; border: none; box-shadow: var(--iw-shadow-glow); }
    .writer-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .writer-row__name { font-size: 0.88rem; font-weight: 700; color: var(--iw-ink); }
    .writer-row__bio { font-size: 0.75rem; color: var(--iw-muted); }
    .follow-btn { margin-left: auto; padding: 6px 16px; border-radius: 100px; border: 1.5px solid var(--iw-brand); color: var(--iw-brand); background: transparent; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.8rem; }
    .follow-btn:hover { background: var(--iw-brand-soft); }
    .follow-btn--following { background: var(--iw-brand); color: #fff; }

    .cta-band { padding: 80px 0; background: var(--iw-bg); }
    .cta-band__inner { background: var(--iw-brand-gradient); border-radius: 32px; padding: 64px; display: flex; justify-content: space-between; align-items: center; color: #fff; position: relative; overflow: hidden; box-shadow: var(--iw-shadow-lg); }
    .cta-band__title { font-family: var(--font-display); font-size: 3rem; line-height: 1.1; color: #fff; }
    .cta-band__sub { color: rgba(255,255,255,0.8); }
    .cta-band__actions { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .cta-band__link { color: #fff; text-decoration: underline; font-weight: 600; font-size: 0.9rem; }

    .footer { padding: 80px 0 40px; border-top: 1px solid var(--iw-border); background: var(--iw-bg-deep); }
    .footer__grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
    .footer__logo { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 16px; color: var(--iw-ink); }
    .footer__desc { color: var(--iw-muted); font-size: 0.9rem; line-height: 1.6; }
    .footer__col-title { font-weight: 700; color: var(--iw-ink-2); margin-bottom: 20px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    .footer__link { display: block; color: var(--iw-muted); text-decoration: none; margin-bottom: 12px; transition: color 0.2s; }
    .footer__link:hover { color: var(--iw-brand); }
    .footer__copy { color: var(--iw-faint); font-size: 0.85rem; }

    .picks-card { opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; }
    .picks-card.is-visible { opacity: 1; transform: translateY(0); }

    .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #fff; flex-shrink: 0; }
    .avatar-md { width: 40px; height: 40px; font-size: 0.9rem; }
    .tag { font-size: 0.7rem; font-weight: 700; color: var(--iw-brand); text-transform: uppercase; letter-spacing: 0.05em; }
    .read-time { font-size: 0.7rem; color: var(--iw-faint); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .section-title { font-family: var(--font-display); font-size: 2rem; color: var(--iw-ink); margin: 0; }
    .section-subtitle { color: var(--iw-muted); margin-top: 8px; }
    .see-all { color: var(--iw-brand); font-weight: 700; text-decoration: none; transition: color 0.2s; }
    .see-all:hover { color: var(--iw-brand-deep); }
    .btn { padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
    .btn-brand { background: var(--iw-brand); color: #fff; }
    .btn-brand:hover { background: var(--iw-brand-deep); }
    .btn-ghost { border: 1px solid var(--iw-border); color: var(--iw-ink-2); background: var(--iw-surface); }
    .btn-ghost:hover { background: var(--iw-brand-soft); border-color: var(--iw-brand); color: var(--iw-brand); }
    .btn-white { background: #fff; color: var(--iw-brand-deep); box-shadow: var(--iw-shadow-md); }
    .btn-white:hover { transform: translateY(-2px); box-shadow: var(--iw-shadow-lg); }
    .btn-full { width: 100%; justify-content: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly postApi = inject(PostApiService);
  private observer: IntersectionObserver | null = null;

  @ViewChildren('revealEl') revealEls!: QueryList<ElementRef<HTMLElement>>;

  readonly picks = signal<any[]>([]);
  readonly trending = signal<any[]>([]);

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
  ];

  protected readonly suggestedWriters = signal([
    { name: 'Priya Mehta',    initials: 'PM', bio: 'Culture & Design',  gradient: 'linear-gradient(135deg,#7c3d8a,#3d1a50)', following: false },
    { name: 'Jatin Kumar',    initials: 'JK', bio: 'Tech & Society',    gradient: 'linear-gradient(135deg,#2a8a6a,#0f3d28)', following: false },
    { name: 'Ananya Lal',     initials: 'AL', bio: 'Fiction & Poetry',  gradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)', following: false },
    { name: 'Siddharth M.',   initials: 'SM', bio: 'Philosophy',        gradient: 'linear-gradient(135deg,#3d78d8,#1a3a7a)', following: false },
  ]);

  ngOnInit() {
    this.postApi.listPosts().pipe(take(1)).subscribe({
      next: (posts) => {
        const published = posts.filter((p: any) => !p.status || p.status.toLowerCase() === 'published');
        const mapped = published.map((p: any) => this.mapPostForDisplay(p));
        
        this.picks.set(mapped.slice(0, 3));
        this.trending.set(mapped.slice(3, 8));
        
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initObserver(), 300);
        }
      },
      error: (err) => console.error('Failed to load home posts', err)
    });
  }

  private mapPostForDisplay(p: any) {
    const emojis = ['🌿', '🏙️', '🎨', '🚀', '🧠', '💡', '🌍', '🧪'];
    const gradients = [
      'linear-gradient(135deg,#c9893a,#9a5f1a)',
      'linear-gradient(135deg,#3d78d8,#1a3a7a)',
      'linear-gradient(135deg,#2a8a6a,#0f3d28)',
      'linear-gradient(135deg,#7c3d8a,#3d1a50)',
    ];
    
    const authorName = p.authorName || p.author?.fullName || p.author?.username || 'InkWell Author';
    const initials = authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return {
      ...p,
      category: p.categoryName || p.category?.name || 'General',
      coverEmoji: emojis[p.id % emojis.length],
      authorGradient: gradients[p.id % gradients.length],
      initials,
      authorName,
      displayDate: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
      viewCount: p.viewCount || 0
    };
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initObserver();
  }

  private initObserver() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.zone.runOutsideAngular(() => {
      try {
        if (this.observer) this.observer.disconnect();
        
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const el = entry.target as HTMLElement;
                setTimeout(() => {
                  this.zone.run(() => el.classList.add('is-visible'));
                }, 50);
                this.observer?.unobserve(el);
              }
            });
          },
          { threshold: 0.1 }
        );

        this.revealEls?.forEach(ref => {
          this.observer?.observe(ref.nativeElement);
        });
      } catch (e) {
        console.error('IntersectionObserver error:', e);
      }
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.observer) {
      this.observer.disconnect();
    }
  }

  toggleFollow(writer: any): void {
    this.suggestedWriters.update(list =>
      list.map(w => w.name === writer.name ? { ...w, following: !w.following } : w)
    );
  }
}