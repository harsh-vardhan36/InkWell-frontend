import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  NgZone,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { NewsletterApiService } from '../../../author/data-access/newsletter-api.service';

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
          <div class="banner-greeting">{{ greeting }}, {{ firstName() }} 👋</div>
          <p class="banner-subtitle">
            You have <strong>{{ draftCount() }} drafts</strong> waiting — and your last post got
            <strong>{{ lastPostViews | number }} views</strong> this week. Keep writing!
          </p>
        </div>

        <div class="banner-right">
          <a routerLink="/write" class="banner-cta">
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
            *ngFor="let stat of statCards(); let i = index"
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
              <span class="animated-number">{{ displayCounters()[i] }}</span>
              <span class="stat-suffix" *ngIf="stat.suffix">{{ stat.suffix }}</span>
            </div>

            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-change-label">{{ stat.changeLabel }}</div>

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

      <!-- ═══════════════ ADVANCED ANALYTICS (PRO ONLY) ═══════════════ -->
      <section class="advanced-analytics" [class.widget--locked]="isFreePlan()">
        <div class="section-header">
          <h2 class="section-title">Advanced Analytics</h2>
          <span class="pro-tag" *ngIf="isFreePlan()">PRO</span>
        </div>
        
        <div class="analytics-placeholder-grid">
          <div class="placeholder-chart">
            <div class="chart-mock">
               <div class="bar" style="height: 60%"></div>
               <div class="bar" style="height: 80%"></div>
               <div class="bar" style="height: 40%"></div>
               <div class="bar" style="height: 90%"></div>
               <div class="bar" style="height: 70%"></div>
            </div>
            <p>Audience Demographics</p>
          </div>
          <div class="placeholder-chart">
            <div class="chart-mock">
               <div class="line-mock"></div>
            </div>
            <p>Engagement Depth</p>
          </div>
        </div>

        <!-- Lock Overlay -->
        <div class="lock-overlay" *ngIf="isFreePlan()">
           <div class="lock-content">
              <span class="lock-icon">⚡</span>
              <p>Advanced Analytics is available for Pro users only</p>
              <a routerLink="/pricing" class="unlock-btn">Upgrade to Pro</a>
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

      <!-- ═══════════════ CONTENT GRID (table + sidebar) ═══════════════ -->
      <section class="content-grid">

        <!-- Posts Table -->
        <div class="posts-panel">
          <div class="panel-header">
            <h2 class="panel-title">Your Posts</h2>
            <div class="panel-actions">
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
              <a routerLink="/write" class="btn-new-post">+ New</a>
            </div>
          </div>

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

              <div class="td td-status">
                <span class="status-badge" [class]="'status-' + post.status">
                  {{ post.status }}
                </span>
              </div>

              <div class="td td-views">
                <span class="metric-value">{{ post.views | number }}</span>
              </div>

              <div class="td td-claps">
                <span class="metric-value">{{ post.claps | number }}</span>
              </div>

              <div class="td td-earn">
                <span class="earn-value">₹{{ post.earnings | number:'1.0-0' }}</span>
              </div>

              <div class="td td-actions">
                <button class="row-action" title="Edit" [routerLink]="['/write', post.id]">✏</button>
                <button class="row-action" title="Analytics">📊</button>
                <button class="row-action row-action--danger" title="Delete">🗑</button>
              </div>
            </div>

            <div class="table-empty" *ngIf="filteredPosts().length === 0">
              <div class="empty-icon">📭</div>
              <p class="empty-msg">No posts in this category yet.</p>
              <a routerLink="/write" class="empty-cta">Write your first post →</a>
            </div>
          </div>

          <div class="table-footer" *ngIf="!isLoading() && filteredPosts().length > 0">
            <span class="table-count">Showing {{ filteredPosts().length }} of {{ allPosts().length }} posts</span>
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

          <!-- Newsletter Card (Locked for FREE) -->
          <div class="widget-card widget-newsletter" [class.widget--locked]="isFreePlan()">
            <div class="widget-header">
              <h3 class="widget-title">💌 Newsletter</h3>
              <span class="widget-badge" [class.badge--locked]="isFreePlan()">{{ isFreePlan() ? 'Locked' : 'Pro' }}</span>
            </div>
            
            <div class="widget-content-wrap">
              <div class="nl-stats">
                <div class="nl-stat">
                  <div class="nl-stat-value">{{ realSubscribersCount() | number }}</div>
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
              <a [routerLink]="isFreePlan() ? '/pricing' : '/dashboard/newsletter'" class="widget-cta widget-cta--amber">
                {{ isFreePlan() ? 'Unlock Newsletter →' : 'Send Newsletter →' }}
              </a>
            </div>

            <!-- Lock Overlay -->
            <div class="lock-overlay" *ngIf="isFreePlan()">
               <div class="lock-content">
                  <span class="lock-icon">🔒</span>
                  <p>Upgrade to Pro to start your newsletter</p>
                  <a routerLink="/pricing" class="unlock-btn">Get Pro</a>
               </div>
            </div>
          </div>

          <!-- Earnings Widget (Locked for FREE) -->
          <div class="widget-card" [class.widget--locked]="isFreePlan()">
            <div class="widget-header">
              <h3 class="widget-title">💰 Earnings</h3>
              <a *ngIf="!isFreePlan()" routerLink="/dashboard/earnings" class="widget-link">View all →</a>
            </div>
            <div class="widget-content-wrap">
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
              <a [routerLink]="isFreePlan() ? '/pricing' : '/dashboard/earnings'" class="widget-cta widget-cta--ghost">
                {{ isFreePlan() ? 'Unlock Monetization' : 'Payout details →' }}
              </a>
            </div>

            <!-- Lock Overlay -->
            <div class="lock-overlay" *ngIf="isFreePlan()">
               <div class="lock-content">
                  <span class="lock-icon">💰</span>
                  <p>Monetize your content with Pro plan</p>
                  <a routerLink="/pricing" class="unlock-btn">Start Earning</a>
               </div>
            </div>
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
              <strong>+{{ realSubscribersCount() }} new subscribers</strong> this week.
              Your latest post drove most of them.
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
    .dashboard { padding: 28px 28px 60px; max-width: 1400px; margin: 0 auto; background: var(--iw-bg); min-height: 100%; }
    .welcome-banner {
      background: var(--iw-brand-gradient);
      border-radius: 20px; padding: 32px 36px; margin-bottom: 28px; display: flex; align-items: center; gap: 32px;
      position: relative; overflow: hidden; opacity: 0; transform: translateY(16px); transition: all 0.5s ease;
      box-shadow: var(--iw-shadow-glow);
    }
    .banner-visible { opacity: 1; transform: translateY(0); }
    .banner-orb { position: absolute; border-radius: 50%; opacity: 0.15; filter: blur(40px); }
    .banner-orb-1 { width: 240px; height: 240px; background: #fff; top: -80px; right: 120px; }
    .banner-orb-2 { width: 160px; height: 160px; background: #fff; bottom: -60px; right: -40px; }
    .banner-greeting { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .banner-subtitle { font-size: 0.92rem; color: rgba(255,255,255,0.85); line-height: 1.55; }
    .banner-cta { background: #fff; color: var(--iw-brand-deep); padding: 12px 24px; border-radius: 12px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 16px rgba(0,0,0,0.12); transition: all 0.2s; position: relative; overflow: hidden; }
    .banner-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
    .banner-cta-ghost { color: #fff; text-decoration: none; font-weight: 600; font-size: 0.9rem; margin-left: 10px; opacity: 0.9; }
    .banner-cta-ghost:hover { opacity: 1; text-decoration: underline; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-card {
      background: var(--iw-surface-solid); border: 1px solid var(--iw-border); border-radius: 18px; padding: 24px 22px 16px;
      position: relative; overflow: hidden; opacity: 0; transform: translateY(16px); transition: all 0.5s ease;
      backdrop-filter: blur(10px);
    }
    .stat-card:hover { transform: translateY(-2px) !important; box-shadow: var(--iw-shadow-md); border-color: var(--iw-brand); }
    .stat-revealed { opacity: 1; transform: translateY(0); }
    .stat-icon-wrap { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .icon-wrap--amber { background: var(--iw-brand-soft); color: var(--iw-brand); }
    .icon-wrap--emerald { background: var(--iw-emerald-soft); color: var(--iw-emerald); }
    .icon-wrap--blue { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .icon-wrap--violet { background: rgba(139,92,246,0.1); color: #8b5cf6; }
    
    .stat-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .stat-change { display: flex; align-items: center; gap: 3px; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 100px; }
    .change-positive { background: var(--iw-emerald-soft); color: var(--iw-emerald); }
    .change-negative { background: rgba(220,50,50,0.1); color: #dc3232; }
    
    .stat-value { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--iw-ink); margin-bottom: 4px; }
    .stat-prefix { font-size: 1.2rem; margin-right: 2px; color: var(--iw-muted); }
    .stat-label { font-size: 0.85rem; color: var(--iw-muted); font-weight: 600; }
    .stat-change-label { font-size: 0.72rem; color: var(--iw-faint); margin-top: 4px; }
    
    .sparkline-wrap { height: 36px; margin: 12px -22px -16px; }
    .sparkline { width: 100%; height: 100%; }

    .quick-actions { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
    .qa-item { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: 1px solid var(--iw-border); background: var(--iw-surface-solid); color: var(--iw-ink); text-decoration: none; transition: all 0.2s; font-size: 0.88rem; font-weight: 600; }
    .qa-item:hover { border-color: var(--iw-brand); color: var(--iw-brand); background: var(--iw-brand-soft); }
    .qa-icon { font-size: 1.1rem; }
    .qa-arrow { opacity: 0; transform: translateX(-5px); transition: all 0.2s; }
    .qa-item:hover .qa-arrow { opacity: 1; transform: translateX(0); }

    .content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
    .posts-panel { background: var(--iw-surface-solid); border: 1px solid var(--iw-border); border-radius: 20px; overflow: hidden; backdrop-filter: blur(10px); }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--iw-border); }
    .panel-title { font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--iw-ink); }
    .panel-actions { display: flex; align-items: center; gap: 16px; }
    
    .filter-tabs { display: flex; background: var(--iw-bg-alt); padding: 4px; border-radius: 10px; border: 1px solid var(--iw-border); }
    .filter-tab { background: none; border: none; padding: 6px 12px; font-size: 0.78rem; font-weight: 600; border-radius: 7px; color: var(--iw-muted); cursor: pointer; transition: all 0.2s; }
    .filter-tab--active { background: var(--iw-surface-solid); color: var(--iw-brand); box-shadow: var(--iw-shadow-sm); }
    .btn-new-post { background: var(--iw-brand); color: #fff; text-decoration: none; padding: 7px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; transition: 0.2s; }
    .btn-new-post:hover { background: var(--iw-brand-deep); transform: translateY(-1px); }

    .posts-table { width: 100%; }
    .table-head { display: grid; grid-template-columns: 3fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr; padding: 12px 24px; background: var(--iw-bg-alt); border-bottom: 1px solid var(--iw-border); }
    .th { font-size: 0.7rem; font-weight: 700; color: var(--iw-faint); text-transform: uppercase; letter-spacing: 0.05em; }
    .table-row { display: grid; grid-template-columns: 3fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr; padding: 16px 24px; border-bottom: 1px solid var(--iw-border); align-items: center; transition: background 0.2s; }
    .table-row:hover { background: var(--iw-brand-soft); }
    .row-draft { opacity: 0.85; }

    .td-post { display: flex; align-items: center; gap: 12px; }
    .post-cover { width: 40px; height: 40px; border-radius: 8px; background: var(--iw-bg-deep); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 1px solid var(--iw-border); }
    .post-title { font-size: 0.9rem; font-weight: 700; color: var(--iw-ink); margin-bottom: 3px; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .post-submeta { font-size: 0.72rem; color: var(--iw-muted); display: flex; align-items: center; gap: 6px; }
    .post-dot { opacity: 0.5; }
    
    .status-badge { display: inline-block; font-size: 0.66rem; font-weight: 800; padding: 3px 10px; border-radius: 100px; text-transform: capitalize; }
    .status-published { background: var(--iw-emerald-soft); color: var(--iw-emerald); }
    .status-draft { background: var(--iw-brand-soft); color: var(--iw-brand); }
    .status-scheduled { background: rgba(59,130,246,0.1); color: #3b82f6; }
    
    .metric-value { font-size: 0.85rem; font-weight: 600; color: var(--iw-ink); }
    .earn-value { font-size: 0.85rem; font-weight: 700; color: var(--iw-emerald); }

    .row-action { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; font-size: 0.85rem; opacity: 0.5; transition: all 0.18s; color: var(--iw-ink); }
    .row-action:hover { opacity: 1; background: var(--iw-bg-alt); color: var(--iw-brand); }
    .row-action--danger:hover { background: rgba(220,50,50,0.1); color: #dc3232; }

    .table-empty { padding: 60px 24px; text-align: center; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .empty-msg { font-size: 0.9rem; color: var(--iw-muted); margin: 0 0 16px; }
    .empty-cta { color: var(--iw-brand); font-weight: 600; text-decoration: none; font-size: 0.88rem; }

    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid var(--iw-border); background: var(--iw-bg-alt); }
    .table-count { font-size: 0.78rem; color: var(--iw-faint); }
    .pagination { display: flex; gap: 4px; }
    .page-btn { width: 30px; height: 30px; border: 1px solid var(--iw-border); background: var(--iw-surface-solid); border-radius: 7px; font-size: 0.8rem; font-weight: 600; color: var(--iw-muted); cursor: pointer; transition: all 0.18s; }
    .page-btn:hover:not(:disabled) { border-color: var(--iw-brand); color: var(--iw-brand); }
    .page-btn--active { background: var(--iw-brand); color: #fff !important; border-color: var(--iw-brand); }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* Right Sidebar */
    .dashboard-sidebar { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 20px; }
    .widget-card { background: var(--iw-surface-solid); border: 1px solid var(--iw-border); border-radius: 18px; padding: 20px; position: relative; overflow: hidden; backdrop-filter: blur(10px); }
    
    .widget-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .widget-title { font-size: 0.95rem; font-weight: 700; color: var(--iw-ink); margin: 0; }
    .widget-badge { background: var(--iw-brand); color: #fff; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; }
    .badge--locked { background: var(--iw-faint) !important; color: #fff !important; }
    .widget-link { font-size: 0.75rem; color: var(--iw-brand); text-decoration: none; font-weight: 600; }
    .widget-link:hover { text-decoration: underline; }
    .widget-period { font-size: 0.72rem; color: var(--iw-faint); }

    .widget--locked .widget-content-wrap { filter: blur(5px); pointer-events: none; opacity: 0.5; }
    .lock-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.05); display: flex; align-items: center; justify-content: center; z-index: 5; }
    .lock-content { text-align: center; padding: 20px; animation: fadeInUp 0.4s ease; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .lock-icon { font-size: 2rem; margin-bottom: 10px; display: block; }
    .lock-content p { font-size: 0.85rem; font-weight: 700; margin: 0 0 15px; color: var(--iw-ink); }
    .unlock-btn { background: var(--iw-brand); color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; box-shadow: var(--iw-shadow-glow); display: inline-block; }

    .nl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
    .nl-stat { background: var(--iw-bg-alt); border: 1px solid var(--iw-border); border-radius: 10px; padding: 10px 8px; text-align: center; }
    .nl-stat-value { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--iw-ink); }
    .nl-stat-label { font-size: 0.6rem; color: var(--iw-faint); margin-top: 2px; font-weight: 600; text-transform: uppercase; }
    .nl-last { font-size: 0.72rem; color: var(--iw-muted); margin-bottom: 14px; }
    .nl-last-label { font-weight: 700; color: var(--iw-ink); margin-right: 4px; }
    
    .widget-cta { display: block; padding: 10px 16px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; text-align: center; text-decoration: none; transition: all 0.2s; }
    .widget-cta--amber { background: var(--iw-brand-gradient); color: #fff; }
    .widget-cta--amber:hover { transform: translateY(-1px); box-shadow: var(--iw-shadow-glow); }
    .widget-cta--ghost { border: 1px solid var(--iw-border); color: var(--iw-ink); background: var(--iw-bg-alt); }
    .widget-cta--ghost:hover { border-color: var(--iw-brand); color: var(--iw-brand); background: var(--iw-brand-soft); }

    .earnings-display { margin-bottom: 16px; }
    .earnings-amount { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; color: var(--iw-emerald); line-height: 1; }
    .earnings-period { font-size: 0.72rem; color: var(--iw-faint); margin-top: 4px; }
    .earnings-bars { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .earn-bar-row { display: flex; align-items: center; gap: 8px; }
    .earn-bar-label { font-size: 0.72rem; color: var(--iw-muted); width: 80px; flex-shrink: 0; }
    .earn-bar-track { flex: 1; height: 6px; background: var(--iw-bg-deep); border-radius: 3px; overflow: hidden; }
    .earn-bar-fill { height: 100%; border-radius: 3px; }
    .earn-fill--amber { background: var(--iw-brand); }
    .earn-fill--emerald { background: var(--iw-emerald); }
    .earn-fill--blue { background: #3b82f6; }
    .earn-bar-val { font-size: 0.72rem; font-weight: 700; color: var(--iw-ink); width: 50px; text-align: right; }

    .top-post-list { display: flex; flex-direction: column; gap: 12px; }
    .top-post-item { display: flex; align-items: flex-start; gap: 10px; }
    .top-post-rank { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; line-height: 1; width: 24px; }
    .rank-1 { color: var(--iw-brand); }
    .rank-2 { color: var(--iw-muted); }
    .rank-3 { color: #c0853a; }
    .top-post-title { font-size: 0.82rem; font-weight: 600; color: var(--iw-ink); line-height: 1.35; margin-bottom: 2px; }
    .top-post-views { font-size: 0.7rem; color: var(--iw-faint); }

    .widget-growth { background: var(--iw-emerald-soft); border-color: var(--iw-emerald); border-opacity: 0.2; }
    .growth-icon { font-size: 1.6rem; margin-bottom: 8px; }
    .growth-text { font-size: 0.82rem; color: var(--iw-muted); line-height: 1.55; margin-bottom: 14px; }
    .growth-text strong { color: var(--iw-emerald); }

    @media (max-width: 1200px) { .content-grid { grid-template-columns: 1fr; } .dashboard-sidebar { position: static; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .welcome-banner { flex-direction: column; align-items: flex-start; gap: 20px; }
      .table-head, .table-row { grid-template-columns: 2fr 1fr 0.8fr 0.8fr; }
      .th-claps, .td-claps, .th-earn, .td-earn { display: none; }
      .dashboard-sidebar { grid-template-columns: 1fr; }
    }

    /* Advanced Analytics Styles */
    .advanced-analytics {
      background: var(--iw-surface-solid);
      border: 1px solid var(--iw-border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .section-title { font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--iw-ink); }
    .pro-tag { background: #ffd700; color: #000; font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
    .analytics-placeholder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .placeholder-chart { background: var(--iw-bg-alt); border: 1px solid var(--iw-border); border-radius: 16px; padding: 20px; text-align: center; }
    .chart-mock { height: 120px; display: flex; align-items: flex-end; justify-content: center; gap: 8px; margin-bottom: 12px; position: relative; }
    .bar { width: 20px; background: var(--iw-brand); border-radius: 4px 4px 0 0; opacity: 0.4; }
    .line-mock { width: 100%; height: 2px; background: var(--iw-brand); position: absolute; top: 50%; left: 0; opacity: 0.3; }
    .placeholder-chart p { font-size: 0.8rem; color: var(--iw-muted); margin: 0; }
  `],
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private authSession = inject(AuthSessionService);
  private postApi = inject(PostApiService);
  private newsletterApi = inject(NewsletterApiService);

  bannerVisible = signal(false);
  statsVisible = signal(false);
  isLoading = computed(() => this.postApi.isLoading());
  activeFilter = signal<string>('All');

  firstName = computed(() => {
    const fullName = this.authSession.user()?.fullName ?? 'Writer';
    return fullName.split(' ')[0];
  });
  
  isFreePlan = computed(() => this.authSession.user()?.plan === 'FREE');

  filters = ['All', 'Published', 'Draft', 'Scheduled'];
  displayCounters = signal<string[]>(['0', '0', '0', '0']);
  
  realSubscribersCount = signal(0);
  
  draftCount = computed(() => 
    this.postApi.authorPosts().filter(p => p.status === 'DRAFT').length
  );
  
  lastPostViews = 4821; // Still mock as backend doesn't track views yet

  sparkColors: Record<string, string> = { amber: '#c9893a', emerald: '#2a8a6a', blue: '#3b82f6', violet: '#8b5cf6' };

  statCards = computed<StatCard[]>(() => {
    const s = this.postApi.authorStats();
    const subs = this.realSubscribersCount();

    return [
      { label: 'Followers', value: subs, displayValue: subs.toString(), change: 0, changeLabel: 'Total followers', icon: '👥', color: 'blue', sparkData: [60, 62, 65, 64, 68, 72, 70, 75, 78, 80, 84, 88] },
      { label: 'Posts Made', value: s.totalPosts || 0, displayValue: (s.totalPosts || 0).toString(), change: 0, changeLabel: 'Total posts', icon: '📄', color: 'violet', sparkData: [30, 32, 35, 34, 36, 38, 37, 40, 41, 43, 45, 47] },
      { label: 'New Comments', value: 0, displayValue: '0', change: 0, changeLabel: 'Coming soon', icon: '💬', color: 'amber', sparkData: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 42, 50] },
      { label: 'Total Views', value: s.totalViews || 0, displayValue: (s.totalViews || 0).toString(), change: 0, changeLabel: 'Global reach', icon: '👁', color: 'emerald', sparkData: [40, 55, 48, 62, 58, 72, 68, 85, 78, 95, 88, 100] },
    ];
  });

  allPosts = computed<Post[]>(() => {
    return this.postApi.authorPosts().map(p => ({
      id: p.id,
      title: p.title,
      status: p.status.toLowerCase() as any,
      views: p.viewCount || 0,
      claps: p.likeCount || 0,
      comments: 0,
      earnings: 0,
      publishedAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just now',
      readTime: 5,
      cover: '📄'
    }));
  });

  filteredPosts = computed(() => {
    const f = this.activeFilter();
    const posts = this.allPosts();
    if (f === 'All') return posts;
    return posts.filter(p => p.status === f.toLowerCase());
  });

  quickActions = [
    { icon: '✍', label: 'New Post', route: '/write', color: 'amber' },
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

  private animateCounters(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const cards = this.statCards();
    const targets = cards.map(c => c.value);
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      const ease = 1 - Math.pow(1 - progress, 3);
      this.displayCounters.set(targets.map((t, i) => {
        const val = Math.round(t * ease);
        if (i === 0) return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val.toString();
        return val.toLocaleString('en-IN');
      }));
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    this.ngZone.runOutsideAngular(() => requestAnimationFrame(tick));
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.postApi.refreshAuthorPosts();

    const user = this.authSession.user();
    if (user) {
      this.newsletterApi.getSubscribers(user.userId).subscribe(subs => {
        this.realSubscribersCount.set(subs.length);
      });
    }

    setTimeout(() => this.bannerVisible.set(true), 100);
    setTimeout(() => this.statsVisible.set(true), 300);
    setTimeout(() => { this.animateCounters(); }, 800);
  }

  ngOnDestroy(): void {}
}
