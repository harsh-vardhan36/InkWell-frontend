import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  AfterViewInit,
  NgZone,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface StatCard {
  label: string;
  value: number;
  displayValue: string;
  change: number;
  changeLabel: string;
  icon: string;
  color: 'amber' | 'emerald' | 'blue' | 'violet';
  prefix?: string;
  suffix?: string;
  sparkData: number[];
}

interface Post {
  id: number;
  title: string;
  status: 'published' | 'draft' | 'scheduled';
  views: number;
  claps: number;
  comments: number;
  earnings: number;
  publishedAt: string;
  readTime: number;
  cover: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">

      <!-- ═══════════════ WELCOME BANNER ═══════════════ -->
      <div class="welcome-banner" [class.banner-visible]="bannerVisible()">
        <div class="banner-orb banner-orb-1"></div>
        <div class="banner-orb banner-orb-2"></div>

        <div class="banner-left">
          <div class="banner-greeting">{{ greeting }}, Arjun 👋</div>
          <p class="banner-subtitle">
            You have <strong>{{ draftCount }} drafts</strong> waiting — and your last post got
            <strong>{{ lastPostViews | number }} views</strong> this week. Keep writing!
          </p>
        </div>

        <div class="banner-right">
          <a routerLink="/dashboard/editor" class="banner-cta">
            <span>✍ Write Now</span>
            <span class="banner-cta-shine"></span>
          </a>
          <a routerLink="/dashboard/analytics" class="banner-cta-ghost">
            View Analytics →
          </a>
        </div>
      </div>

      <!-- ═══════════════ STAT CARDS ═══════════════ -->
      <section class="stats-section">
        <div class="stats-grid">
          <div
            class="stat-card"
            *ngFor="let stat of statCards; let i = index"
            [class]="'stat-card--' + stat.color"
            [class.stat-revealed]="statsVisible()"
            [style.transition-delay]="i * 80 + 'ms'"
          >
            <div class="stat-top">
              <div class="stat-icon-wrap" [class]="'icon-wrap--' + stat.color">
                {{ stat.icon }}
              </div>
              <div class="stat-change" [class.change-positive]="stat.change > 0" [class.change-negative]="stat.change < 0">
                <span>{{ stat.change > 0 ? '▲' : '▼' }}</span>
                {{ stat.change | number:'1.1-1' }}%
              </div>
            </div>

            <div class="stat-value">
              <span class="stat-prefix" *ngIf="stat.prefix">{{ stat.prefix }}</span>
              <span class="animated-number" [attr.data-target]="stat.value">{{ displayCounters()[i] }}</span>
              <span class="stat-suffix" *ngIf="stat.suffix">{{ stat.suffix }}</span>
            </div>

            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-change-label">{{ stat.changeLabel }}</div>

            <!-- Sparkline SVG -->
            <div class="sparkline-wrap">
              <svg class="sparkline" viewBox="0 0 120 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient [id]="'spark-fill-' + i" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" [attr.stop-color]="sparkColors[stat.color]" stop-opacity="0.35"/>
                    <stop offset="100%" [attr.stop-color]="sparkColors[stat.color]" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path [attr.d]="getSparkFillPath(stat.sparkData)" [attr.fill]="'url(#spark-fill-' + i + ')'"/>
                <path [attr.d]="getSparkLinePath(stat.sparkData)" [attr.stroke]="sparkColors[stat.color]" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ QUICK ACTIONS ═══════════════ -->
      <section class="quick-actions">
        <a *ngFor="let action of quickActions" [routerLink]="action.route" class="qa-item" [class]="'qa--' + action.color">
          <span class="qa-icon">{{ action.icon }}</span>
          <span class="qa-label">{{ action.label }}</span>
          <span class="qa-arrow">→</span>
        </a>
      </section>

      <!-- ═══════════════ POSTS TABLE + SIDEBAR ═══════════════ -->
      <section class="content-grid">

        <!-- Posts Table -->
        <div class="posts-panel">
          <div class="panel-header">
            <h2 class="panel-title">Your Posts</h2>
            <div class="panel-actions">
              <!-- Status filter -->
              <div class="filter-tabs">
                <button
                  *ngFor="let f of filters"
                  class="filter-tab"
                  [class.filter-tab--active]="activeFilter() === f"
                  (click)="setFilter(f)"
                >
                  {{ f }}
                </button>
              </div>
              <a routerLink="/dashboard/editor" class="btn-new-post">+ New</a>
            </div>
          </div>

          <!-- Loading shimmer -->
          <div *ngIf="isLoading()" class="posts-shimmer">
            <div class="shimmer-row" *ngFor="let n of [1,2,3,4]">
              <div class="shimmer-cover shimmer-anim"></div>
              <div class="shimmer-text">
                <div class="shimmer-line shimmer-anim" style="width:60%"></div>
                <div class="shimmer-line shimmer-anim" style="width:35%"></div>
              </div>
              <div class="shimmer-meta shimmer-anim"></div>
            </div>
          </div>

          <!-- Table -->
          <div class="posts-table" *ngIf="!isLoading()">
            <div class="table-head">
              <div class="th th-post">Post</div>
              <div class="th th-status">Status</div>
              <div class="th th-views">Views</div>
              <div class="th th-claps">Claps</div>
              <div class="th th-earn">Earned</div>
              <div class="th th-actions"></div>
            </div>

            <div
              class="table-row"
              *ngFor="let post of filteredPosts(); trackBy: trackById"
              [class.row-draft]="post.status === 'draft'"
            >
              <!-- Post cell -->
              <div class="td td-post">
                <div class="post-cover">{{ post.cover }}</div>
                <div class="post-meta">
                  <div class="post-title" [class.post-title-muted]="post.status === 'draft'">{{ post.title }}</div>
                  <div class="post-submeta">
                    <span class="post-date">{{ post.publishedAt }}</span>
                    <span class="post-dot">·</span>
                    <span class="post-readtime">{{ post.readTime }} min read</span>
                  </div>
                </div>
              </div>

              <!-- Status -->
              <div class="td td-status">
                <span class="status-badge" [class]="'status-' + post.status">
                  {{ post.status }}
                </span>
              </div>

              <!-- Views -->
              <div class="td td-views">
                <span class="metric-value">{{ post.views | number }}</span>
              </div>

              <!-- Claps -->
              <div class="td td-claps">
                <span class="metric-value">{{ post.claps | number }}</span>
              </div>

              <!-- Earnings -->
              <div class="td td-earn">
                <span class="earn-value">₹{{ post.earnings | number:'1.0-0' }}</span>
              </div>

              <!-- Actions -->
              <div class="td td-actions">
                <button class="row-action" title="Edit" [routerLink]="['/dashboard/editor', post.id]">✏</button>
                <button class="row-action" title="Analytics">📊</button>
                <button class="row-action row-action--danger" title="Delete">🗑</button>
              </div>
            </div>

            <!-- Empty state -->
            <div class="table-empty" *ngIf="filteredPosts().length === 0">
              <div class="empty-icon">📭</div>
              <p class="empty-msg">No posts in this category yet.</p>
              <a routerLink="/dashboard/editor" class="empty-cta">Write your first post →</a>
            </div>
          </div>

          <!-- Pagination -->
          <div class="table-footer" *ngIf="!isLoading() && filteredPosts().length > 0">
            <span class="table-count">Showing {{ filteredPosts().length }} of {{ allPosts.length }} posts</span>
            <div class="pagination">
              <button class="page-btn" disabled>‹</button>
              <button class="page-btn page-btn--active">1</button>
              <button class="page-btn">2</button>
              <button class="page-btn">›</button>
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <aside class="dashboard-sidebar">

          <!-- Newsletter Card -->
          <div class="widget-card widget-newsletter">
            <div class="widget-header">
              <h3 class="widget-title">💌 Newsletter</h3>
              <span class="widget-badge">Pro</span>
            </div>
            <div class="nl-stats">
              <div class="nl-stat">
                <div class="nl-stat-value">2,841</div>
                <div class="nl-stat-label">Subscribers</div>
              </div>
              <div class="nl-stat">
                <div class="nl-stat-value">68%</div>
                <div class="nl-stat-label">Open rate</div>
              </div>
              <div class="nl-stat">
                <div class="nl-stat-value">14%</div>
                <div class="nl-stat-label">Click rate</div>
              </div>
            </div>
            <div class="nl-last">
              <span class="nl-last-label">Last sent:</span>
              <span>Apr 18, 2026 · 2,799 delivered</span>
            </div>
            <a routerLink="/dashboard/newsletter" class="widget-cta widget-cta--amber">
              Send Newsletter →
            </a>
          </div>

          <!-- Earnings Widget -->
          <div class="widget-card">
            <div class="widget-header">
              <h3 class="widget-title">💰 Earnings</h3>
              <a routerLink="/dashboard/earnings" class="widget-link">View all →</a>
            </div>
            <div class="earnings-display">
              <div class="earnings-amount">₹18,420</div>
              <div class="earnings-period">This month</div>
            </div>
            <div class="earnings-bars">
              <div class="earn-bar-row" *ngFor="let bar of earningsBreakdown">
                <span class="earn-bar-label">{{ bar.label }}</span>
                <div class="earn-bar-track">
                  <div class="earn-bar-fill" [style.width]="bar.pct + '%'" [class]="'earn-fill--' + bar.color"></div>
                </div>
                <span class="earn-bar-val">₹{{ bar.amount | number }}</span>
              </div>
            </div>
            <a routerLink="/dashboard/earnings" class="widget-cta widget-cta--ghost">
              Payout details →
            </a>
          </div>

          <!-- Top Posts widget -->
          <div class="widget-card">
            <div class="widget-header">
              <h3 class="widget-title">🏆 Top Posts</h3>
              <span class="widget-period">This week</span>
            </div>
            <div class="top-post-list">
              <div class="top-post-item" *ngFor="let p of topPosts; let i = index">
                <div class="top-post-rank" [class]="'rank-' + (i+1)">{{ i + 1 }}</div>
                <div class="top-post-info">
                  <div class="top-post-title">{{ p.title }}</div>
                  <div class="top-post-views">{{ p.views | number }} views</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscriber growth nudge -->
          <div class="widget-card widget-growth">
            <div class="growth-icon">📈</div>
            <div class="growth-text">
              <strong>+143 new subscribers</strong> this week.
              Your "India's Startup Winter" post drove 60% of them.
            </div>
            <a routerLink="/dashboard/analytics" class="widget-cta widget-cta--ghost">
              See breakdown →
            </a>
          </div>

        </aside>
      </section>

    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════
       DASHBOARD WRAPPER
    ══════════════════════════════════════════ */
    .dashboard {
      padding: 28px 28px 60px;
      max-width: 1400px;
      margin: 0 auto;
      font-family: var(--font-body);
      color: var(--iw-ink);
      background: var(--iw-bg);
      min-height: 100%;
    }

    /* ══════════════════════════════════════════
       WELCOME BANNER
    ══════════════════════════════════════════ */
    .welcome-banner {
      background: linear-gradient(135deg, #6b3510 0%, var(--iw-brand) 55%, #d4a264 100%);
      border-radius: 20px;
      padding: 32px 36px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      gap: 32px;
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .banner-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .banner-orb {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
      pointer-events: none;
    }
    .banner-orb-1 {
      width: 240px; height: 240px;
      background: #fff;
      top: -80px; right: 120px;
      filter: blur(40px);
    }
    .banner-orb-2 {
      width: 160px; height: 160px;
      background: #fff;
      bottom: -60px; right: -40px;
      filter: blur(30px);
    }

    .banner-left {
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .banner-greeting {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }

    .banner-subtitle {
      font-size: 0.92rem;
      color: rgba(255,255,255,0.82);
      margin: 0;
      line-height: 1.55;
    }
    .banner-subtitle strong { color: #fff; }

    .banner-right {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    }

    .banner-cta {
      position: relative;
      background: #fff;
      color: var(--iw-brand);
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.9rem;
      text-decoration: none;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 2px 16px rgba(0,0,0,0.12);
      white-space: nowrap;
    }
    .banner-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.2); }

    .banner-cta-shine {
      position: absolute;
      top: 0; left: -100%;
      width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(201,137,58,0.15), transparent);
      transform: skewX(-20deg);
      transition: left 0.5s;
    }
    .banner-cta:hover .banner-cta-shine { left: 150%; }

    .banner-cta-ghost {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
      white-space: nowrap;
    }
    .banner-cta-ghost:hover { color: #fff; }

    /* ══════════════════════════════════════════
       STAT CARDS
    ══════════════════════════════════════════ */
    .stats-section { margin-bottom: 20px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-card {
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: 18px;
      padding: 24px 22px 16px;
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s;
    }

    .stat-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-2px) !important; }

    .stat-revealed { opacity: 1; transform: translateY(0); }

    .stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .stat-icon-wrap {
      width: 38px; height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .icon-wrap--amber { background: rgba(201,137,58,0.12); }
    .icon-wrap--emerald { background: rgba(42,138,106,0.12); }
    .icon-wrap--blue { background: rgba(59,130,246,0.12); }
    .icon-wrap--violet { background: rgba(139,92,246,0.12); }

    .stat-change {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 100px;
    }
    .change-positive { background: rgba(42,138,106,0.1); color: #2a8a6a; }
    .change-negative { background: rgba(220,50,50,0.1); color: #c0392b; }

    .stat-value {
      display: flex;
      align-items: baseline;
      gap: 2px;
      line-height: 1;
      margin-bottom: 4px;
    }

    .animated-number {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--iw-ink);
    }

    .stat-prefix, .stat-suffix {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--iw-ink-muted);
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--iw-ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 2px;
    }

    .stat-change-label {
      font-size: 0.72rem;
      color: var(--iw-ink-muted);
      margin-bottom: 14px;
    }

    .sparkline-wrap {
      height: 36px;
      margin: 0 -4px -4px;
    }

    .sparkline {
      width: 100%;
      height: 100%;
    }

    /* ══════════════════════════════════════════
       QUICK ACTIONS
    ══════════════════════════════════════════ */
    .quick-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .qa-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--iw-border);
      background: var(--iw-bg-alt);
      color: var(--iw-ink);
      transition: all 0.2s;
    }
    .qa-item:hover { border-color: var(--iw-brand); color: var(--iw-brand); background: var(--iw-brand-soft); }

    .qa-icon { font-size: 1rem; }
    .qa-arrow { margin-left: 4px; opacity: 0.5; font-size: 0.8rem; }

    /* ══════════════════════════════════════════
       CONTENT GRID (table + sidebar)
    ══════════════════════════════════════════ */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 20px;
      align-items: start;
    }

    /* ══════════════════════════════════════════
       POSTS PANEL
    ══════════════════════════════════════════ */
    .posts-panel {
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: 20px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--iw-border);
      gap: 12px;
      flex-wrap: wrap;
    }

    .panel-title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--iw-ink);
      margin: 0;
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .filter-tabs {
      display: flex;
      gap: 2px;
      background: var(--iw-bg);
      border: 1px solid var(--iw-border);
      border-radius: 10px;
      padding: 3px;
    }

    .filter-tab {
      padding: 5px 14px;
      border-radius: 7px;
      border: none;
      background: none;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--iw-ink-muted);
      cursor: pointer;
      transition: all 0.18s;
      text-transform: capitalize;
    }
    .filter-tab:hover { color: var(--iw-ink); }
    .filter-tab--active {
      background: var(--iw-brand);
      color: #fff !important;
    }

    .btn-new-post {
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
      padding: 8px 16px;
      border-radius: 9px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .btn-new-post:hover { transform: translateY(-1px); box-shadow: 0 4px 14px var(--iw-brand-glow); }

    /* Shimmer */
    .posts-shimmer { padding: 12px 24px; }
    .shimmer-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 0;
      border-bottom: 1px solid var(--iw-border);
    }
    .shimmer-cover {
      width: 48px; height: 48px;
      border-radius: 10px;
      flex-shrink: 0;
    }
    .shimmer-text { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .shimmer-line {
      height: 10px;
      border-radius: 5px;
    }
    .shimmer-meta {
      width: 80px; height: 24px;
      border-radius: 8px;
    }
    .shimmer-anim {
      background: linear-gradient(90deg, var(--iw-border) 25%, var(--iw-bg) 50%, var(--iw-border) 75%);
      background-size: 200% 100%;
      animation: shimmerSlide 1.4s ease-in-out infinite;
    }
    @keyframes shimmerSlide {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Table */
    .posts-table { width: 100%; }

    .table-head {
      display: grid;
      grid-template-columns: 3fr 0.7fr 0.7fr 0.7fr 0.7fr 0.6fr;
      padding: 10px 24px;
      background: var(--iw-bg);
      border-bottom: 1px solid var(--iw-border);
    }

    .th {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--iw-ink-muted);
    }
    .th-views, .th-claps, .th-earn, .th-actions, .th-status { text-align: center; }

    .table-row {
      display: grid;
      grid-template-columns: 3fr 0.7fr 0.7fr 0.7fr 0.7fr 0.6fr;
      padding: 14px 24px;
      border-bottom: 1px solid var(--iw-border);
      align-items: center;
      transition: background 0.18s;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: var(--iw-brand-soft); }
    .row-draft { opacity: 0.75; }

    .td { display: flex; align-items: center; }
    .td-post { gap: 12px; }
    .td-status, .td-views, .td-claps, .td-earn, .td-actions { justify-content: center; }

    .post-cover {
      width: 44px; height: 44px;
      border-radius: 10px;
      background: var(--iw-bg);
      border: 1px solid var(--iw-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .post-meta { overflow: hidden; }

    .post-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--iw-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .post-title-muted { color: var(--iw-ink-muted); }

    .post-submeta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      color: var(--iw-ink-muted);
    }
    .post-dot { opacity: 0.4; }

    .status-badge {
      display: inline-block;
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 100px;
    }
    .status-published { background: rgba(42,138,106,0.12); color: #2a8a6a; }
    .status-draft { background: var(--iw-brand-soft); color: var(--iw-brand); }
    .status-scheduled { background: rgba(59,130,246,0.12); color: #3b82f6; }

    .metric-value {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--iw-ink);
    }

    .earn-value {
      font-size: 0.88rem;
      font-weight: 700;
      color: #2a8a6a;
    }

    .row-action {
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      border-radius: 6px;
      font-size: 0.85rem;
      opacity: 0.5;
      transition: all 0.18s;
    }
    .row-action:hover { opacity: 1; background: var(--iw-bg); }
    .row-action--danger:hover { background: rgba(220,50,50,0.08); }

    .table-empty {
      padding: 60px 24px;
      text-align: center;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .empty-msg { font-size: 0.9rem; color: var(--iw-ink-muted); margin: 0 0 16px; }
    .empty-cta { color: var(--iw-brand); font-weight: 600; text-decoration: none; font-size: 0.88rem; }

    .table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      border-top: 1px solid var(--iw-border);
      background: var(--iw-bg);
    }

    .table-count { font-size: 0.78rem; color: var(--iw-ink-muted); }

    .pagination { display: flex; gap: 4px; }

    .page-btn {
      width: 30px; height: 30px;
      border: 1px solid var(--iw-border);
      background: var(--iw-bg-alt);
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--iw-ink-muted);
      cursor: pointer;
      transition: all 0.18s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--iw-brand); color: var(--iw-brand); }
    .page-btn--active { background: var(--iw-brand); color: #fff !important; border-color: var(--iw-brand); }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ══════════════════════════════════════════
       RIGHT SIDEBAR WIDGETS
    ══════════════════════════════════════════ */
    .dashboard-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 20px;
    }

    .widget-card {
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: 18px;
      padding: 20px;
    }

    .widget-newsletter {
      border-color: var(--iw-brand-glow);
      background: linear-gradient(145deg, var(--iw-bg-alt), rgba(201,137,58,0.04));
    }

    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .widget-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--iw-ink);
      margin: 0;
    }

    .widget-badge {
      background: var(--iw-brand);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 100px;
      letter-spacing: 0.04em;
    }

    .widget-link {
      font-size: 0.75rem;
      color: var(--iw-brand);
      text-decoration: none;
      font-weight: 600;
    }
    .widget-link:hover { text-decoration: underline; }

    .widget-period {
      font-size: 0.72rem;
      color: var(--iw-ink-muted);
    }

    /* Newsletter stats */
    .nl-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .nl-stat {
      background: var(--iw-bg);
      border: 1px solid var(--iw-border);
      border-radius: 10px;
      padding: 10px 8px;
      text-align: center;
    }

    .nl-stat-value {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--iw-ink);
      line-height: 1;
    }

    .nl-stat-label {
      font-size: 0.65rem;
      color: var(--iw-ink-muted);
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .nl-last {
      font-size: 0.72rem;
      color: var(--iw-ink-muted);
      margin-bottom: 14px;
    }
    .nl-last-label { font-weight: 700; color: var(--iw-ink); margin-right: 4px; }

    /* Widget CTAs */
    .widget-cta {
      display: block;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      transition: all 0.2s;
    }
    .widget-cta--amber {
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
    }
    .widget-cta--amber:hover { transform: translateY(-1px); box-shadow: 0 4px 16px var(--iw-brand-glow); }
    .widget-cta--ghost {
      border: 1px solid var(--iw-border);
      color: var(--iw-ink);
    }
    .widget-cta--ghost:hover { border-color: var(--iw-brand); color: var(--iw-brand); }

    /* Earnings */
    .earnings-display { margin-bottom: 16px; }
    .earnings-amount {
      font-family: var(--font-display);
      font-size: 1.9rem;
      font-weight: 700;
      color: #2a8a6a;
      line-height: 1;
    }
    .earnings-period { font-size: 0.72rem; color: var(--iw-ink-muted); margin-top: 3px; }

    .earnings-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .earn-bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .earn-bar-label {
      font-size: 0.72rem;
      color: var(--iw-ink-muted);
      width: 80px;
      flex-shrink: 0;
    }

    .earn-bar-track {
      flex: 1;
      height: 6px;
      background: var(--iw-bg);
      border-radius: 3px;
      overflow: hidden;
    }

    .earn-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .earn-fill--amber { background: var(--iw-brand); }
    .earn-fill--emerald { background: #2a8a6a; }
    .earn-fill--blue { background: #3b82f6; }

    .earn-bar-val {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--iw-ink);
      width: 50px;
      text-align: right;
      flex-shrink: 0;
    }

    /* Top posts */
    .top-post-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .top-post-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .top-post-rank {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1;
      width: 24px;
      flex-shrink: 0;
    }
    .rank-1 { color: var(--iw-brand); }
    .rank-2 { color: var(--iw-ink-muted); }
    .rank-3 { color: #c0853a; }
    .rank-4, .rank-5 { color: var(--iw-border); }

    .top-post-info {}

    .top-post-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--iw-ink);
      line-height: 1.35;
      margin-bottom: 2px;
    }

    .top-post-views {
      font-size: 0.7rem;
      color: var(--iw-ink-muted);
    }

    /* Growth nudge */
    .widget-growth {
      background: linear-gradient(135deg, rgba(42,138,106,0.06), rgba(42,138,106,0.02));
      border-color: rgba(42,138,106,0.2);
    }

    .growth-icon { font-size: 1.6rem; margin-bottom: 8px; }
    .growth-text {
      font-size: 0.82rem;
      color: var(--iw-ink-muted);
      line-height: 1.55;
      margin-bottom: 14px;
    }
    .growth-text strong { color: #2a8a6a; }

    /* ══════════════════════════════════════════
       RESPONSIVE
    ══════════════════════════════════════════ */
    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      .dashboard-sidebar {
        position: static;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .dashboard { padding: 20px 16px 80px; }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
      .welcome-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
      }
      .banner-right { align-items: stretch; width: 100%; }
      .table-head, .table-row {
        grid-template-columns: 2fr 0.6fr 0.6fr 0.6fr;
      }
      .th-claps, .td-claps { display: none; }
      .dashboard-sidebar { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  bannerVisible = signal(false);
  statsVisible = signal(false);
  isLoading = signal(true);
  activeFilter = signal<string>('All');

  filters = ['All', 'Published', 'Draft', 'Scheduled'];

  displayCounters = signal<string[]>(['0', '0', '0', '0']);

  draftCount = 5;
  lastPostViews = 4821;

  sparkColors: Record<string, string> = {
    amber: '#c9893a',
    emerald: '#2a8a6a',
    blue: '#3b82f6',
    violet: '#8b5cf6',
  };

  statCards: StatCard[] = [
    {
      label: 'Total Views',
      value: 128400,
      displayValue: '128.4K',
      change: 18.4,
      changeLabel: 'vs last month',
      icon: '👁',
      color: 'amber',
      sparkData: [40, 55, 48, 62, 58, 72, 68, 85, 78, 95, 88, 100],
    },
    {
      label: 'Earnings',
      value: 18420,
      displayValue: '₹18,420',
      change: 32.1,
      changeLabel: 'vs last month',
      icon: '💰',
      color: 'emerald',
      prefix: '₹',
      sparkData: [30, 42, 38, 55, 48, 60, 65, 72, 68, 85, 80, 95],
    },
    {
      label: 'Subscribers',
      value: 2841,
      displayValue: '2,841',
      change: 8.7,
      changeLabel: '+143 this week',
      icon: '👥',
      color: 'blue',
      sparkData: [60, 62, 65, 64, 68, 72, 70, 75, 78, 80, 84, 88],
    },
    {
      label: 'Published Posts',
      value: 47,
      displayValue: '47',
      change: -2.1,
      changeLabel: '5 drafts pending',
      icon: '📄',
      color: 'violet',
      sparkData: [30, 32, 35, 34, 36, 38, 37, 40, 41, 43, 45, 47],
    },
  ];

  allPosts: Post[] = [
    { id: 1, title: 'India\'s Startup Winter: What VCs Aren\'t Telling You', status: 'published', views: 48210, claps: 2140, comments: 83, earnings: 6420, publishedAt: 'Apr 18, 2026', readTime: 9, cover: '📉' },
    { id: 2, title: 'The Last Bookstore in Connaught Place', status: 'published', views: 31480, claps: 1820, comments: 54, earnings: 4180, publishedAt: 'Apr 12, 2026', readTime: 7, cover: '📚' },
    { id: 3, title: 'Why I Left My ₹40L Job to Write Full-Time', status: 'published', views: 24100, claps: 3210, comments: 121, earnings: 3840, publishedAt: 'Apr 5, 2026', readTime: 11, cover: '✍️' },
    { id: 4, title: 'The Quiet Crisis in Indian Higher Education', status: 'scheduled', views: 0, claps: 0, comments: 0, earnings: 0, publishedAt: 'Apr 25, 2026', readTime: 12, cover: '🎓' },
    { id: 5, title: 'How to Build a Second Brain on ₹0 Budget', status: 'draft', views: 0, claps: 0, comments: 0, earnings: 0, publishedAt: 'Draft', readTime: 8, cover: '🧠' },
    { id: 6, title: 'Diwali in Delhi vs Diwali in Silicon Valley', status: 'draft', views: 0, claps: 0, comments: 0, earnings: 0, publishedAt: 'Draft', readTime: 6, cover: '🪔' },
    { id: 7, title: 'The Real Reason Indians Don\'t Talk About Mental Health', status: 'published', views: 18340, claps: 980, comments: 67, earnings: 2180, publishedAt: 'Mar 28, 2026', readTime: 10, cover: '🧘' },
  ];

  filteredPosts = computed(() => {
    const f = this.activeFilter();
    if (f === 'All') return this.allPosts;
    return this.allPosts.filter(p => p.status === f.toLowerCase());
  });

  quickActions = [
    { icon: '✍', label: 'New Post', route: '/dashboard/editor', color: 'amber' },
    { icon: '💌', label: 'Send Newsletter', route: '/dashboard/newsletter', color: 'default' },
    { icon: '📊', label: 'Analytics', route: '/dashboard/analytics', color: 'default' },
    { icon: '👥', label: 'Subscribers', route: '/dashboard/subscribers', color: 'default' },
  ];

  earningsBreakdown = [
    { label: 'Subscriptions', pct: 72, amount: 13262, color: 'amber' },
    { label: 'Tips', pct: 18, amount: 3316, color: 'emerald' },
    { label: 'Boosts', pct: 10, amount: 1842, color: 'blue' },
  ];

  topPosts = [
    { title: 'India\'s Startup Winter: What VCs Aren\'t Telling You', views: 48210 },
    { title: 'The Last Bookstore in Connaught Place', views: 31480 },
    { title: 'Why I Left My ₹40L Job to Write Full-Time', views: 24100 },
    { title: 'The Real Reason Indians Don\'t Talk About Mental Health', views: 18340 },
  ];

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  setFilter(f: string): void {
    this.activeFilter.set(f);
  }

  trackById(_: number, post: Post): number {
    return post.id;
  }

  /* SVG Sparkline helpers */
  getSparkLinePath(data: number[]): string {
    const w = 120, h = 36;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    });
    return `M${pts.join('L')}`;
  }

  getSparkFillPath(data: number[]): string {
    const w = 120, h = 36;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    });
    return `M0,${h}L${pts.join('L')}L${w},${h}Z`;
  }

  /* Animated counters */
  private animateCounters(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const targets = [128400, 18420, 2841, 47];
    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      const ease = 1 - Math.pow(1 - progress, 3);

      this.displayCounters.set(targets.map((t, i) => {
        const val = Math.round(t * ease);
        if (i === 0) return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val.toString();
        if (i === 1) return val.toLocaleString('en-IN');
        return val.toLocaleString('en-IN');
      }));

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(tick);
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Stagger entrance animations
    setTimeout(() => this.bannerVisible.set(true), 100);
    setTimeout(() => this.statsVisible.set(true), 300);
    setTimeout(() => {
      this.isLoading.set(false);
      this.animateCounters();
    }, 800);
  }

  ngOnDestroy(): void {}
}