import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';


type FilterTab = { id: string; label: string; };

interface FeedPost {
  id: string;
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  author: string;
  initials: string;
  avatarGradient: string;
  published: string;
  claps: number;
  comments: number;
  emoji: string;
  bookmarked: boolean;
  clapPending?: boolean;
}

interface SuggestedWriter {
  name: string;
  initials: string;
  bio: string;
  gradient: string;
  following: boolean;
}
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `

    <!-- ══ PAGE HEADER ══ -->
    <div class="feed-header">
      <div class="feed-header__left">
        <h1 class="feed-header__title">Explore</h1>
        <p class="feed-header__sub">Stories from writers you follow and beyond</p>
      </div>
      <div class="feed-header__actions">
        <!-- Search bar -->
        <div class="search-bar" [class.search-bar--focused]="searchFocused()">
          <span class="search-bar__icon">🔍</span>
          <input
            #searchInput
            class="search-bar__input"
            type="search"
            placeholder="Search stories, writers…"
            [(ngModel)]="searchQuery"
            (focus)="searchFocused.set(true)"
            (blur)="searchFocused.set(false)"
            (ngModelChange)="onSearch($event)"
          />
          <kbd *ngIf="!searchFocused()" class="search-bar__kbd">⌘K</kbd>
        </div>
        <a class="btn btn-brand btn-sm" routerLink="/write">✍ Write</a>
      </div>
    </div>

    <!-- ══ FILTER TABS ══ -->
    <div class="filter-row" #filterRow>
      <div class="filter-tabs">
        <button
          *ngFor="let tab of filterTabs"
          class="filter-tab"
          [class.filter-tab--active]="activeTab() === tab.id"
          (click)="setTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="filter-row__divider"></div>
    </div>

    <!-- ══ MAIN LAYOUT ══ -->
    <div class="feed-layout">

      <!-- ── FEED COLUMN ── -->
      <div class="feed-col">

        <!-- Shimmer loading state -->
        <ng-container *ngIf="isLoading()">
          <div class="shimmer-card" *ngFor="let i of [1,2,3]">
            <div class="shimmer-card__body">
              <div class="shimmer-line shimmer-line--sm"></div>
              <div class="shimmer-line shimmer-line--lg"></div>
              <div class="shimmer-line shimmer-line--md"></div>
              <div class="shimmer-line shimmer-line--sm"></div>
            </div>
            <div class="shimmer-card__thumb"></div>
          </div>
        </ng-container>

        <!-- Feed posts -->
        <ng-container *ngIf="!isLoading()">

          <ng-container *ngIf="filteredPosts().length > 0; else emptyState">
            <article
              *ngFor="let post of filteredPosts(); trackBy: trackById"
              class="feed-post"
              [routerLink]="['/blog', post.id]"
            >
              <!-- Author row -->
              <div class="feed-post__author">
                <div class="avatar avatar-sm" [style.background]="post.avatarGradient">
                  {{ post.initials }}
                </div>
                <span class="feed-post__author-name">{{ post.author }}</span>
                <span class="feed-post__dot">·</span>
                <span class="feed-post__date">{{ post.published }}</span>
              </div>

              <!-- Content + thumb -->
              <div class="feed-post__row">
                <div class="feed-post__body">
                  <h2 class="feed-post__title">{{ post.title }}</h2>
                  <p class="feed-post__excerpt">{{ post.excerpt }}</p>
                </div>
                <div class="feed-post__thumb">
                  <div class="feed-post__thumb-inner">{{ post.emoji }}</div>
                </div>
              </div>

              <!-- Footer row -->
              <div class="feed-post__footer" (click)="$event.stopPropagation()">
                <span class="tag">{{ post.category }}</span>
                <span class="read-time">{{ post.readTime }}</span>

                <div class="feed-post__engagement">
                  <button
                    class="engage-btn"
                    [class.engage-btn--active]="post.clapPending"
                    (click)="clap(post)"
                    title="Clap"
                  >
                    <span class="engage-btn__icon">{{ post.clapPending ? '❤️' : '♡' }}</span>
                    <span>{{ post.claps }}</span>
                  </button>
                  <button class="engage-btn" title="Comments">
                    <span class="engage-btn__icon">💬</span>
                    <span>{{ post.comments }}</span>
                  </button>
                </div>

                <button
                  class="bookmark-btn"
                  [class.bookmark-btn--saved]="post.bookmarked"
                  (click)="toggleBookmark(post)"
                  [title]="post.bookmarked ? 'Remove bookmark' : 'Bookmark'"
                >
                  {{ post.bookmarked ? '🔖' : '🔖' }}
                  <span class="sr-only">{{ post.bookmarked ? 'Saved' : 'Save' }}</span>
                </button>
              </div>
            </article>
          </ng-container>

          <!-- Empty state -->
          <ng-template #emptyState>
            <div class="empty-state">
              <div class="empty-state__icon">📭</div>
              <h3 class="empty-state__title">No stories found</h3>
              <p class="empty-state__sub">
                Try a different filter, or
                <a routerLink="/write">write one yourself</a>.
              </p>
            </div>
          </ng-template>

          <!-- Load more -->
          <div class="load-more" *ngIf="filteredPosts().length > 0 && !searchQuery">
            <button class="load-more__btn" (click)="loadMore()" [disabled]="isLoadingMore()">
              <span *ngIf="!isLoadingMore()">Load more stories</span>
              <span *ngIf="isLoadingMore()" class="load-more__spinner"></span>
            </button>
          </div>

        </ng-container>
      </div>

      <!-- ── SIDEBAR ── -->
      <aside class="feed-sidebar">

        <!-- Staff picks -->
        <div class="sidebar-card">
          <div class="sidebar-card__title">⭐ Staff Picks</div>
          <div
            class="staff-pick"
            *ngFor="let pick of staffPicks; let i = index"
          >
            <div class="staff-pick__num">{{ (i + 1).toString().padStart(2,'0') }}</div>
            <div class="staff-pick__body">
              <a class="staff-pick__title" [routerLink]="['/blog', pick.id]">{{ pick.title }}</a>
              <div class="staff-pick__meta">
                <div class="avatar avatar-sm" [style.background]="pick.gradient">{{ pick.initials }}</div>
                <span>{{ pick.author }}</span>
                <span class="read-time">{{ pick.readTime }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Suggested writers -->
        <div class="sidebar-card">
          <div class="sidebar-card__title">✦ Writers to Follow</div>
          <div class="writer-row" *ngFor="let writer of suggestedWriters()">
            <div class="avatar avatar-md" [style.background]="writer.gradient">
              {{ writer.initials }}
            </div>
            <div class="writer-row__info">
              <div class="writer-row__name">{{ writer.name }}</div>
              <div class="writer-row__bio">{{ writer.bio }}</div>
            </div>
            <button
              class="follow-btn"
              [class.follow-btn--following]="writer.following"
              (click)="toggleFollow(writer)"
            >
              {{ writer.following ? '✓ Following' : 'Follow' }}
            </button>
          </div>
        </div>

        <!-- Topics -->
        <div class="sidebar-card">
          <div class="sidebar-card__title">🏷 Recommended Topics</div>
          <div class="sidebar-topics">
            <a
              *ngFor="let topic of sidebarTopics"
              class="sidebar-topic"
              routerLink="/feed"
              (click)="setTab('for-you')"
            >
              {{ topic }}
            </a>
          </div>
        </div>

        <!-- Reading list nudge -->
        <div class="sidebar-card sidebar-card--brand">
          <p class="sidebar-card__brand-text">
            Your reading list is empty. Save stories with 🔖 to read later.
          </p>
          <a routerLink="/dashboard" class="btn btn-white btn-sm" style="margin-top:14px;display:inline-flex">
            Go to dashboard →
          </a>
        </div>

      </aside>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0 0 clamp(48px, 6vw, 80px);
    }

    /* ════════════════════════
       PAGE HEADER
    ════════════════════════ */
    .feed-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      padding: clamp(24px, 4vw, 40px) 0 20px;
      flex-wrap: wrap;
    }

    .feed-header__title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 3rem);
      letter-spacing: -0.04em;
      line-height: 1;
      margin: 0 0 6px;
    }

    .feed-header__sub {
      font-size: 0.875rem;
      color: var(--iw-muted);
      margin: 0;
    }

    .feed-header__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Search bar */
    .search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      background: var(--iw-surface);
      border: 1.5px solid var(--iw-border);
      border-radius: var(--r-pill);
      backdrop-filter: blur(10px);
      transition: var(--trans);
      width: 200px;
    }

    .search-bar--focused {
      border-color: var(--iw-brand);
      box-shadow: 0 0 0 3px var(--iw-brand-soft);
      width: 260px;
    }

    .search-bar__icon {
      font-size: 0.85rem;
      flex-shrink: 0;
      opacity: 0.6;
    }

    .search-bar__input {
      border: none;
      background: transparent;
      outline: none;
      font-family: var(--font-body);
      font-size: 0.85rem;
      color: var(--iw-ink);
      width: 100%;
      min-width: 0;
    }

    .search-bar__input::placeholder {
      color: var(--iw-faint);
    }

    .search-bar__input::-webkit-search-cancel-button {
      -webkit-appearance: none;
    }

    .search-bar__kbd {
      font-size: 0.65rem;
      color: var(--iw-faint);
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border-2);
      border-radius: 4px;
      padding: 1px 5px;
      font-family: var(--font-body);
      flex-shrink: 0;
    }

    /* ════════════════════════
       FILTER TABS
    ════════════════════════ */
    .filter-row {
      position: sticky;
      top: 80px;
      z-index: 10;
      background: var(--iw-bg);
      margin-bottom: 24px;
    }

    .filter-tabs {
      display: flex;
      align-items: center;
      gap: 2px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 2px;
    }

    .filter-tabs::-webkit-scrollbar { display: none; }

    .filter-tab {
      flex-shrink: 0;
      padding: 8px 16px;
      border-radius: var(--r-pill);
      font-size: 0.83rem;
      font-weight: 500;
      color: var(--iw-muted);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: var(--trans);
      white-space: nowrap;
    }

    .filter-tab:hover {
      color: var(--iw-ink);
      background: var(--iw-bg-alt);
      border-color: var(--iw-border);
    }

    .filter-tab--active {
      background: var(--iw-ink);
      color: var(--iw-bg);
      border-color: transparent;
      font-weight: 600;
    }

    .filter-row__divider {
      height: 1px;
      background: var(--iw-border);
      margin-top: 4px;
    }

    /* ════════════════════════
       FEED LAYOUT
    ════════════════════════ */
    .feed-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 32px;
      align-items: start;
    }

    /* ════════════════════════
       FEED COLUMN
    ════════════════════════ */
    .feed-col {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── Shimmer skeletons ── */
    .shimmer-card {
      display: grid;
      grid-template-columns: 1fr 96px;
      gap: 20px;
      padding: 22px 0;
      border-bottom: 1px solid var(--iw-border);
      align-items: start;
    }

    .shimmer-card__body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .shimmer-line {
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        var(--iw-bg-alt) 25%,
        var(--iw-bg-deep) 50%,
        var(--iw-bg-alt) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s infinite;
      height: 14px;
    }

    .shimmer-line--sm  { width: 40%; height: 11px; }
    .shimmer-line--md  { width: 70%; height: 14px; }
    .shimmer-line--lg  { width: 100%; height: 20px; }

    .shimmer-card__thumb {
      width: 96px;
      height: 72px;
      border-radius: var(--r-md);
      background: linear-gradient(
        90deg,
        var(--iw-bg-alt) 25%,
        var(--iw-bg-deep) 50%,
        var(--iw-bg-alt) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.6s infinite;
    }

    /* ── Feed post item ── */
    .feed-post {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 22px 0;
      border-bottom: 1px solid var(--iw-border);
      cursor: pointer;
      transition: var(--trans);
      animation: fadeUp 0.4s ease both;
    }

    .feed-post:first-child { padding-top: 0; }

    .feed-post:hover {
      background: transparent;
    }

    .feed-post:hover .feed-post__title {
      color: var(--iw-brand);
    }

    /* Author row */
    .feed-post__author {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feed-post__author-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--iw-ink-2);
    }

    .feed-post__dot {
      color: var(--iw-faint);
      font-size: 0.8rem;
    }

    .feed-post__date {
      font-size: 0.78rem;
      color: var(--iw-faint);
    }

    /* Content row */
    .feed-post__row {
      display: grid;
      grid-template-columns: 1fr 112px;
      gap: 20px;
      align-items: start;
    }

    .feed-post__title {
      font-family: var(--font-display);
      font-size: 1.2rem;
      letter-spacing: -0.025em;
      line-height: 1.28;
      color: var(--iw-ink);
      margin: 0 0 8px;
      transition: color 0.18s ease;
    }

    .feed-post__excerpt {
      font-size: 0.875rem;
      color: var(--iw-muted);
      line-height: 1.65;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .feed-post__thumb {
      width: 112px;
      height: 80px;
      border-radius: var(--r-md);
      overflow: hidden;
      flex-shrink: 0;
    }

    .feed-post__thumb-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      background: linear-gradient(135deg, var(--iw-brand-soft), var(--iw-bg-alt));
      transition: transform 0.35s ease;
    }

    .feed-post:hover .feed-post__thumb-inner {
      transform: scale(1.08);
    }

    /* Footer row */
    .feed-post__footer {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .feed-post__engagement {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }

    /* Engagement buttons */
    .engage-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: var(--r-pill);
      border: 1px solid var(--iw-border);
      background: transparent;
      color: var(--iw-muted);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--trans);
    }

    .engage-btn:hover {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .engage-btn--active {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .engage-btn__icon {
      font-size: 0.9rem;
      line-height: 1;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .engage-btn--active .engage-btn__icon {
      transform: scale(1.25);
      animation: clapBurst 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Bookmark button */
    .bookmark-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--iw-border);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      cursor: pointer;
      transition: var(--trans);
      color: var(--iw-muted);
      opacity: 0.5;
    }

    .bookmark-btn:hover,
    .bookmark-btn--saved {
      opacity: 1;
      border-color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    /* Empty state */
    .empty-state {
      padding: 64px 0;
      text-align: center;
    }

    .empty-state__icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .empty-state__title {
      font-family: var(--font-display);
      font-size: 1.4rem;
      letter-spacing: -0.02em;
      color: var(--iw-ink);
      margin-bottom: 8px;
    }

    .empty-state__sub {
      font-size: 0.9rem;
      color: var(--iw-muted);
    }

    .empty-state__sub a {
      color: var(--iw-brand);
      font-weight: 600;
    }

    /* Load more */
    .load-more {
      padding: 32px 0 8px;
      display: flex;
      justify-content: center;
    }

    .load-more__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 28px;
      border-radius: var(--r-pill);
      border: 1.5px solid var(--iw-border-2);
      background: var(--iw-surface);
      color: var(--iw-ink-2);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--trans);
      backdrop-filter: blur(8px);
      min-width: 160px;
    }

    .load-more__btn:hover:not(:disabled) {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .load-more__btn:disabled {
      cursor: default;
    }

    .load-more__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--iw-border-2);
      border-top-color: var(--iw-brand);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: block;
    }

    /* ════════════════════════
       SIDEBAR
    ════════════════════════ */
    .feed-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 132px;
    }

    .sidebar-card {
      background: var(--iw-surface);
      backdrop-filter: blur(14px) saturate(1.5);
      -webkit-backdrop-filter: blur(14px) saturate(1.5);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      padding: 18px 20px;
      box-shadow: var(--iw-shadow-sm);
    }

    .sidebar-card--brand {
      background: var(--iw-brand-gradient);
      border-color: transparent;
    }

    .sidebar-card__title {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--iw-faint);
      margin-bottom: 14px;
    }

    .sidebar-card__brand-text {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.80);
      line-height: 1.6;
      margin: 0;
    }

    /* Staff picks */
    .staff-pick {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid var(--iw-border);
    }

    .staff-pick:last-child { border-bottom: none; }

    .staff-pick__num {
      font-family: var(--font-display);
      font-size: 1.6rem;
      letter-spacing: -0.06em;
      color: var(--iw-faint);
      line-height: 1;
      flex-shrink: 0;
      min-width: 28px;
    }

    .staff-pick__title {
      font-family: var(--font-display);
      font-size: 0.92rem;
      letter-spacing: -0.02em;
      line-height: 1.35;
      color: var(--iw-ink);
      text-decoration: none;
      display: block;
      margin-bottom: 7px;
      transition: color 0.18s ease;
    }

    .staff-pick__title:hover {
      color: var(--iw-brand);
    }

    .staff-pick__meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
      color: var(--iw-muted);
    }

    /* Writer rows */
    .writer-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid var(--iw-border);
    }

    .writer-row:last-child { border-bottom: none; }

    .writer-row__info {
      flex: 1;
      min-width: 0;
    }

    .writer-row__name {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--iw-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .writer-row__bio {
      font-size: 0.75rem;
      color: var(--iw-muted);
    }

    .follow-btn {
      flex-shrink: 0;
      padding: 4px 11px;
      border-radius: var(--r-pill);
      font-size: 0.74rem;
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
      border-color: var(--iw-brand-soft);
      color: var(--iw-brand);
    }

    /* Topics cloud */
    .sidebar-topics {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .sidebar-topic {
      display: inline-block;
      padding: 4px 12px;
      border-radius: var(--r-pill);
      background: var(--iw-chip);
      color: var(--iw-brand);
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      transition: var(--trans);
      cursor: pointer;
    }

    .sidebar-topic:hover {
      background: var(--iw-brand);
      color: white;
    }

    /* ════════════════════════
       RESPONSIVE
    ════════════════════════ */
    @media (max-width: 1024px) {
      .feed-layout {
        grid-template-columns: 1fr 260px;
        gap: 24px;
      }
    }

    @media (max-width: 820px) {
      .feed-layout {
        grid-template-columns: 1fr;
      }

      .feed-sidebar {
        position: static;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .feed-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
      }

      .feed-header__actions {
        width: 100%;
      }

      .search-bar,
      .search-bar--focused {
        flex: 1;
        width: auto;
      }

      .feed-post__row {
        grid-template-columns: 1fr 88px;
        gap: 14px;
      }

      .feed-post__thumb {
        width: 88px;
        height: 64px;
      }

      .feed-sidebar {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 400px) {
      .feed-post__row {
        grid-template-columns: 1fr;
      }

      .feed-post__thumb {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('filterRow')   filterRowRef!:  ElementRef<HTMLElement>;

  /* ── State ── */
  readonly activeTab      = signal<string>('for-you');
  readonly isLoading      = signal(true);
  readonly isLoadingMore  = signal(false);
  readonly searchFocused  = signal(false);
  searchQuery = '';

  /* ── Data ── */
  private readonly allPosts = signal<FeedPost[]>([
    {
      id: 'quiet-art',
      category: 'Philosophy',
      readTime: '8 min read',
      title: 'The Quiet Art of Doing Nothing: A Meditation on Stillness in an Age of Noise',
      excerpt: "We live in a civilization that worships productivity. Every idle moment is colonised by a notification, a podcast, a scroll. But what if stillness is not a luxury — it's a necessity?",
      author: 'Shreya Rao',
      initials: 'SR',
      avatarGradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)',
      published: '2 hours ago',
      claps: 248,
      comments: 34,
      emoji: '🌿',
      bookmarked: false,
    },
    {
      id: 'ai-urban',
      category: 'Technology',
      readTime: '5 min read',
      title: 'How AI is Quietly Rewriting the Rules of Urban Planning',
      excerpt: 'From traffic flow to zoning laws, algorithms are increasingly making the decisions that shape our cities. The humans nominally in charge are often just rubber-stamping AI recommendations.',
      author: 'Arjun Kulkarni',
      initials: 'AK',
      avatarGradient: 'linear-gradient(135deg,#3d78d8,#1a3a7a)',
      published: 'Apr 17',
      claps: 189,
      comments: 21,
      emoji: '🏙️',
      bookmarked: false,
    },
    {
      id: 'social-media-90',
      category: 'Wellness',
      readTime: '4 min read',
      title: 'I Quit Social Media for 90 Days — Here\'s What Actually Changed',
      excerpt: 'The first week was agony. By week four, something unexpected happened: I started to remember who I was before the algorithm.',
      author: 'Nandita K.',
      initials: 'NK',
      avatarGradient: 'linear-gradient(135deg,#2a8a6a,#0f3d28)',
      published: 'Apr 14',
      claps: 512,
      comments: 67,
      emoji: '🧘',
      bookmarked: true,
    },
    {
      id: 'middle-manager',
      category: 'Business',
      readTime: '7 min read',
      title: 'The Silent Collapse of the Middle Manager',
      excerpt: 'AI didn\'t eliminate the front-line worker first. It gutted the layer that was supposed to be safe. The corporate middle is hollowing out faster than anyone predicted.',
      author: 'Rahul Verma',
      initials: 'RV',
      avatarGradient: 'linear-gradient(135deg,#8a3d2a,#4a1a10)',
      published: 'Apr 13',
      claps: 391,
      comments: 88,
      emoji: '⚡',
      bookmarked: false,
    },
    {
      id: 'dark-matter',
      category: 'Science',
      readTime: '9 min read',
      title: 'We\'ve Been Wrong About Dark Matter. New Evidence Rewrites Cosmology',
      excerpt: 'A series of telescope observations have produced results that challenge the dominant model of what holds galaxies together.',
      author: 'Dr. Divya S.',
      initials: 'DS',
      avatarGradient: 'linear-gradient(135deg,#2a4a8a,#0f1e50)',
      published: 'Apr 12',
      claps: 274,
      comments: 45,
      emoji: '🌌',
      bookmarked: false,
    },
    {
      id: 'gen-z-craft',
      category: 'Culture',
      readTime: '6 min read',
      title: 'The Renaissance of Handmade: Why Gen Z is Choosing Craft Over Code',
      excerpt: 'In a world of digital everything, a growing number of young people are turning to pottery, weaving, and woodwork as antidotes to screen fatigue.',
      author: 'Priya Mehta',
      initials: 'PM',
      avatarGradient: 'linear-gradient(135deg,#7c3d8a,#3d1a50)',
      published: 'Apr 11',
      claps: 218,
      comments: 29,
      emoji: '🎨',
      bookmarked: false,
    },
    {
      id: 'slow-reading',
      category: 'Writing',
      readTime: '5 min read',
      title: 'The Joy of Slow Reading in a Fast World',
      excerpt: 'On savouring pages instead of skimming headlines, and what we lose when we stop giving books the time they deserve.',
      author: 'Shreya Rao',
      initials: 'SR',
      avatarGradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)',
      published: 'Mar 30',
      claps: 187,
      comments: 22,
      emoji: '📚',
      bookmarked: false,
    },
    {
      id: 'newsletter-loops',
      category: 'Business',
      readTime: '5 min read',
      title: 'Newsletter Loops That Make Every Article More Valuable Over Time',
      excerpt: 'A lightweight loop between posts, subscriptions, and follow-up emails that compounds audience growth without burning out.',
      author: 'Ava Collins',
      initials: 'AC',
      avatarGradient: 'linear-gradient(135deg,#d4644a,#8a2a18)',
      published: 'Mar 28',
      claps: 163,
      comments: 17,
      emoji: '✉️',
      bookmarked: false,
    },
  ]);

  readonly filteredPosts = computed(() => {
    const tab   = this.activeTab();
    const query = this.searchQuery.toLowerCase().trim();
    let posts   = this.allPosts();

    /* Tab filter */
    const categoryMap: Record<string, string> = {
      technology: 'Technology',
      philosophy: 'Philosophy',
      science:    'Science',
      culture:    'Culture',
      business:   'Business',
      wellness:   'Wellness',
      writing:    'Writing',
    };

    if (tab !== 'for-you' && tab !== 'following' && categoryMap[tab]) {
      posts = posts.filter(p => p.category === categoryMap[tab]);
    }

    /* Search filter */
    if (query) {
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    return posts;
  });

  readonly suggestedWriters = signal<SuggestedWriter[]>([
    { name: 'Priya Mehta',  initials: 'PM', bio: 'Culture & Design',  gradient: 'linear-gradient(135deg,#7c3d8a,#3d1a50)', following: false },
    { name: 'Jatin Kumar',  initials: 'JK', bio: 'Tech & Society',    gradient: 'linear-gradient(135deg,#2a8a6a,#0f3d28)', following: false },
    { name: 'Ananya Lal',   initials: 'AL', bio: 'Fiction & Poetry',  gradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)', following: false },
    { name: 'Devika Shah',  initials: 'DV', bio: 'Product & Growth',  gradient: 'linear-gradient(135deg,#3d78d8,#1a3a7a)', following: true  },
  ]);

  readonly staffPicks = [
    { id: 'quiet-art',     title: 'The Quiet Art of Doing Nothing',             author: 'Shreya Rao',   initials: 'SR', gradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)', readTime: '8 min' },
    { id: 'dark-matter',   title: 'Dark Matter Evidence Rewrites Cosmology',    author: 'Dr. Divya S.', initials: 'DS', gradient: 'linear-gradient(135deg,#2a4a8a,#0f1e50)', readTime: '9 min' },
    { id: 'slow-reading',  title: 'The Joy of Slow Reading in a Fast World',    author: 'Shreya Rao',   initials: 'SR', gradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)', readTime: '5 min' },
    { id: 'gen-z-craft',   title: 'Why Gen Z is Choosing Craft Over Code',      author: 'Priya Mehta',  initials: 'PM', gradient: 'linear-gradient(135deg,#7c3d8a,#3d1a50)', readTime: '6 min' },
  ];

  readonly sidebarTopics = [
    '✍ Writing', '🌿 Wellness', '🚀 Tech', '📚 Books',
    '🎨 Design', '🌍 Culture', '🧪 Science', '📈 Business',
  ];

  readonly filterTabs: FilterTab[] = [
    { id: 'for-you',     label: 'For you'    },
    { id: 'following',   label: 'Following'  },
    { id: 'technology',  label: 'Technology' },
    { id: 'philosophy',  label: 'Philosophy' },
    { id: 'science',     label: 'Science'    },
    { id: 'culture',     label: 'Culture'    },
    { id: 'business',    label: 'Business'   },
    { id: 'wellness',    label: 'Wellness'   },
    { id: 'writing',     label: 'Writing'    },
  ];

  /* ── Keyboard shortcut: ⌘K / Ctrl+K to focus search ── */
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.searchInputRef?.nativeElement?.focus();
    }
  }

  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    /* Simulate async data load */
    setTimeout(() => this.isLoading.set(false), 800);
  }


  ngAfterViewInit(): void {
    /* No additional setup needed */
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
  }

  setTab(id: string): void {
    this.activeTab.set(id);
    this.searchQuery = '';
  }

  onSearch(_query: string): void {
    /* computed() reacts to searchQuery change automatically via template binding */
  }

  clap(post: FeedPost): void {
    this.allPosts.update(posts =>
      posts.map(p =>
        p.id === post.id
          ? { ...p, clapPending: !p.clapPending, claps: p.clapPending ? p.claps - 1 : p.claps + 1 }
          : p
      )
    );
  }

  toggleBookmark(post: FeedPost): void {
    this.allPosts.update(posts =>
      posts.map(p => p.id === post.id ? { ...p, bookmarked: !p.bookmarked } : p)
    );
  }

  toggleFollow(writer: SuggestedWriter): void {
    this.suggestedWriters.update(list =>
      list.map(w => w.name === writer.name ? { ...w, following: !w.following } : w)
    );
  }

  loadMore(): void {
    this.isLoadingMore.set(true);
    setTimeout(() => this.isLoadingMore.set(false), 1200);
  }

  trackById(_: number, post: FeedPost): string {
    return post.id;
  }
}