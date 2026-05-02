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
  effect,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { AuthApiService } from '../../../auth/data-access/auth-api.service';


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
  coverImageUrl?: string;
  clapPending?: boolean;
  authorId: string | number;
}

interface SuggestedWriter {
  name: string;
  initials: string;
  bio: string;
  gradient: string;
  following: boolean;
  followers: number;
  userId: string | number;
}

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `

    <!-- ══ PAGE HEADER ══ -->
    <div class="container">
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
              [ngModel]="searchQuery()"
              (focus)="searchFocused.set(true)"
              (blur)="searchFocused.set(false)"
              (ngModelChange)="onSearch($event)"
            />
            <kbd *ngIf="!searchFocused()" class="search-bar__kbd">⌘K</kbd>
          </div>
          <a class="btn btn-brand btn-sm" routerLink="/write">✍ Write</a>
        </div>
      </div>
    </div>

    <!-- ══ FILTER TABS ══ -->
    <div class="filter-row" #filterRow>
      <div class="container">
        <div class="filter-tabs">
          <button
            *ngFor="let tab of filterTabs()"
            class="filter-tab"
            [class.filter-tab--active]="activeTab() === tab.id"
            (click)="setTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="filter-row__divider"></div>
      </div>
    </div>

    <!-- ══ MAIN LAYOUT ══ -->
    <div class="container">
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
                <div class="feed-post__author" (click)="$event.stopPropagation(); router.navigate(['/profile', post.authorId])" style="cursor: pointer;">
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
                    <img *ngIf="post.coverImageUrl; else noThumb" [src]="post.coverImageUrl" alt="Post cover" class="feed-post__thumb-img" />
                    <ng-template #noThumb>
                      <div class="feed-post__thumb-inner">{{ post.emoji }}</div>
                    </ng-template>
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
                      [title]="isGuest() ? 'Sign in to clap' : 'Clap'"
                    >
                      <span class="engage-btn__icon">{{ post.clapPending ? '❤️' : '♡' }}</span>
                      <span>{{ post.claps }} {{ isGuest() ? '🔒' : '' }}</span>
                    </button>
                    <button class="engage-btn" title="Comments">
                      <span class="engage-btn__icon">💬</span>
                      <span>{{ post.comments }} {{ isGuest() ? '🔒' : '' }}</span>
                    </button>
                  </div>

                  <button
                    class="bookmark-btn"
                    [class.bookmark-btn--saved]="post.bookmarked"
                    (click)="toggleBookmark(post)"
                    [title]="isGuest() ? 'Sign in to bookmark' : (post.bookmarked ? 'Remove bookmark' : 'Bookmark')"
                  >
                    {{ post.bookmarked ? '🔖' : '🔖' }}
                    <span class="sr-only">{{ post.bookmarked ? 'Saved' : 'Save' }}</span>
                    <span *ngIf="isGuest()" style="font-size: 0.6rem; position: absolute; bottom: -2px; right: -2px;">🔒</span>
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

          <!-- Trending -->
          <div class="sidebar-card">
            <div class="sidebar-card__title">🔥 Trending on InkWell</div>
            <div
              class="staff-pick"
              *ngFor="let pick of trendingPosts(); let i = index"
            >
              <div class="staff-pick__num">{{ (i + 1).toString().padStart(2,'0') }}</div>
              <div class="staff-pick__body">
                <a class="staff-pick__title" [routerLink]="['/blog', pick.id]">{{ pick.title }}</a>
                  <div class="staff-pick__meta" (click)="$event.stopPropagation(); router.navigate(['/profile', pick.authorId])" style="cursor: pointer;">
                    <div class="avatar avatar-sm" [style.background]="pick.avatarGradient">{{ pick.initials }}</div>
                    <span>{{ pick.author }}</span>
                    <span class="read-time">{{ pick.readTime }}</span>
                  </div>
              </div>
            </div>
            <div *ngIf="trendingPosts().length === 0" class="empty-trending">
               No trending posts yet.
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
                <a [routerLink]="['/profile', writer.userId]" class="writer-row__name">{{ writer.name }}</a>
                <div class="writer-row__bio">
                  {{ writer.bio }}
                  <span class="writer-row__followers">· {{ (writer.followers + (writer.following ? 1 : 0)) | number }} followers</span>
                </div>
              </div>
              <button
                class="follow-btn"
                [class.follow-btn--following]="writer.following"
                (click)="toggleFollow(writer)"
                [title]="isGuest() ? 'Sign in to follow' : ''"
              >
                {{ writer.following ? '✓ Following' : (isGuest() ? 'Follow 🔒' : 'Follow') }}
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
      background: transparent;
    }

    .feed-post:first-child { padding-top: 0; }

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
      line-clamp: 2;
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
      background: var(--iw-bg-deep);
      transition: transform 0.35s ease;
    }

    .feed-post__thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }

    .feed-post:hover .feed-post__thumb-inner,
    .feed-post:hover .feed-post__thumb-img {
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
      color: #fff;
      opacity: 0.9;
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

    .empty-trending {
      font-size: 0.8rem;
      color: var(--iw-faint);
      text-align: center;
      padding: 10px 0;
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
  readonly searchQuery    = signal('');

  /* ── Data ── */
  private readonly allPosts = signal<FeedPost[]>([]);
  readonly trendingPosts = signal<FeedPost[]>([]);

  readonly filteredPosts = computed(() => {
    const tab   = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();
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
        (p.title || '').toLowerCase().includes(query) ||
        (p.excerpt || '').toLowerCase().includes(query) ||
        (p.author || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
      );
    }

    return posts;
  });

  private readonly followingNames = signal<Set<string>>(new Set());

  readonly suggestedWriters = computed(() => {
    const posts = this.trendingPosts();
    const followed = this.followingNames();
    const uniqueAuthors = new Map<string, SuggestedWriter>();

    posts.forEach(p => {
      if (!uniqueAuthors.has(p.author)) {
        uniqueAuthors.set(p.author, {
          userId: p.authorId,
          name: p.author,
          initials: p.initials,
          bio: p.category || 'Thought Leader',
          gradient: p.avatarGradient,
          following: followed.has(p.author),
          followers: (p as any).followerCount || 1200
        });
      }
    });

    return Array.from(uniqueAuthors.values()).slice(0, 4);
  });

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

  readonly filterTabs = computed(() => {
    const baseTabs = [
      { id: 'for-you',    label: 'For you' },
      { id: 'following',  label: 'Following' },
      { id: 'technology', label: 'Technology' },
      { id: 'philosophy', label: 'Philosophy' },
      { id: 'science',    label: 'Science' },
      { id: 'culture',    label: 'Culture' },
      { id: 'business',   label: 'Business' },
      { id: 'wellness',   label: 'Wellness' },
      { id: 'writing',    label: 'Writing' },
    ];
    
    if (this.isGuest()) {
      return baseTabs.filter(t => t.id !== 'following');
    }
    return baseTabs;
  });

  /* ── Keyboard shortcut: ⌘K / Ctrl+K to focus search ── */
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.searchInputRef?.nativeElement?.focus();
    }
  }

  private readonly platformId = inject(PLATFORM_ID);
  private readonly postApiService = inject(PostApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly authApiService = inject(AuthApiService);
  protected readonly router = inject(Router);
  readonly isGuest = computed(() => !this.authSession.isAuthenticated());

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.fetchPosts();
    this.fetchTrendingPosts();
  }

  private fetchTrendingPosts(): void {
    this.postApiService.getTrendingPosts().subscribe({
      next: (posts: any) => {
        const mapped = (posts as any[]).map(p => this.mapPost(p)).slice(0, 7);
        this.trendingPosts.set(mapped);
      },
      error: () => {}
    });
  }

  private mapPost(p: any): FeedPost {
    return {
      id: p.id.toString(),
      category: p.category?.name || 'General',
      readTime: '5 min read',
      title: p.title,
      excerpt: p.excerpt || p.summary || 'No excerpt available',
      author: p.authorName || p.author?.fullName || p.author?.username || 'InkWell Author',
      initials: (p.authorName || p.author?.fullName || p.author?.username || 'IA').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      avatarGradient: 'linear-gradient(135deg,#c9893a,#9a5f1a)',
      published: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      claps: p.likeCount || 0,
      comments: 0,
      emoji: '📝',
      bookmarked: false,
      coverImageUrl: p.coverImageUrl || p.coverUrl || p.thumbnailUrl || p.featuredImageUrl,
      authorId: p.authorId || p.author?.id || 0
    };
  }

  private fetchPosts(): void {
    this.isLoading.set(true);
    this.postApiService.listPosts().subscribe({
      next: (posts: any) => {
        const mappedPosts: FeedPost[] = (posts as any[]).map(p => this.mapPost(p));
        this.allPosts.set(mappedPosts);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }


  ngAfterViewInit(): void {
    /* No additional setup needed */
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
  }

  setTab(id: string): void {
    this.activeTab.set(id);
    this.searchQuery.set('');
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  clap(post: FeedPost): void {
    if (this.isGuest()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.allPosts.update((posts: FeedPost[]) =>
      posts.map((p: FeedPost) =>
        p.id === post.id
          ? { ...p, clapPending: !p.clapPending, claps: p.clapPending ? p.claps - 1 : p.claps + 1 }
          : p
      )
    );
  }

  toggleBookmark(post: FeedPost): void {
    if (this.isGuest()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.allPosts.update((posts: FeedPost[]) =>
      posts.map((p: FeedPost) => p.id === post.id ? { ...p, bookmarked: !p.bookmarked } : p)
    );
  }

  toggleFollow(writer: SuggestedWriter): void {
    if (this.isGuest()) {
      void this.router.navigate(['/login']);
      return;
    }

    const name = writer.name;
    const userId = writer.userId;
    if (!userId) return;

    const currentlyFollowing = this.followingNames().has(name);

    if (currentlyFollowing) {
      this.authApiService.unfollowUser(userId).subscribe({
        next: () => {
          this.followingNames.update(set => {
            const newSet = new Set(set);
            newSet.delete(name);
            return newSet;
          });
        }
      });
    } else {
      this.authApiService.followUser(userId).subscribe({
        next: () => {
          this.followingNames.update(set => {
            const newSet = new Set(set);
            newSet.add(name);
            return newSet;
          });
        }
      });
    }
  }

  loadMore(): void {
    this.isLoadingMore.set(true);
    setTimeout(() => this.isLoadingMore.set(false), 1200);
  }

  trackById(_: number, post: FeedPost): string {
    return post.id;
  }
}