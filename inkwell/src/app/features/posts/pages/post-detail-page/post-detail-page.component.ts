import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { AuthApiService, AuthUser } from '../../../auth/data-access/auth-api.service';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { CommentApiService, Comment } from '../../data-access/comment-api.service';
import { FormsModule } from '@angular/forms';

@Component({
  // Triggering recompile
  selector: 'app-post-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `

    <!-- ══ READING PROGRESS BAR ══ -->
    <div class="progress-track" aria-hidden="true">
      <div class="progress-bar" [style.width.%]="readProgress()"></div>
    </div>

    <!-- ══ STICKY AUTHOR BAR (appears after hero scrolls out) ══ -->
    <div class="sticky-bar" [class.sticky-bar--visible]="showStickyBar()">
      <div class="sticky-bar__inner">
        <div class="sticky-bar__left">
          <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#c9893a,#9a5f1a);flex-shrink:0">
            SR
          </div>
          <span class="sticky-bar__author">{{ article().author }}</span>
          <span class="sticky-bar__title">{{ article().title }}</span>
        </div>
        <div class="sticky-bar__actions">
          <button class="interact-pill" (click)="onClap()" [class.interact-pill--active]="hasClapped()" [title]="isGuest() ? 'Sign in to clap' : 'Clap'">
            <span class="interact-pill__icon" [class.clap-burst]="clapAnimating()">
              {{ hasClapped() ? '❤️' : '♡' }}
            </span>
            {{ article().claps + (hasClapped() ? 1 : 0) }} {{ isGuest() ? '🔒' : '' }}
          </button>
          <button class="interact-pill">💬 {{ article().comments }}</button>
          <button class="interact-pill" [class.interact-pill--active]="bookmarked()" (click)="onBookmark()" [title]="isGuest() ? 'Sign in to bookmark' : 'Bookmark'">
            🔖 {{ isGuest() ? '🔒' : '' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ MAIN ARTICLE ══ -->
    <article class="post-article" #articleEl>

      <!-- ── POST HEADER ── -->
      <header class="post-header" #headerEl>

        <!-- Tags + read time -->
        <div class="post-header__chips">
          <span class="tag">{{ article().category }}</span>
          <span class="tag tag-muted">{{ article().readTime }}</span>
        </div>

        <!-- Headline -->
        <h1 class="post-heading">{{ article().title }}</h1>

        <!-- Lead / deck -->
        <p class="post-lead">{{ article().summary }}</p>

        <!-- Author bar -->
        <div class="post-author-bar" (click)="router.navigate(['/profile', article().authorId])" style="cursor: pointer;">
          <div class="avatar avatar-lg" [style.background]="article().avatarGradient || 'linear-gradient(135deg,#c9893a,#9a5f1a)'">
            {{ article().initials || 'A' }}
          </div>
          <div class="post-author-bar__info">
            <div class="post-author-bar__name">{{ article().author }}</div>
            <div class="post-author-bar__meta">
              {{ article().published }} · {{ article().readTime }}
              <span class="post-author-bar__claps">· {{ article().claps }} claps</span>
            </div>
          </div>
          <div class="post-author-bar__actions">
            <button
              class="interact-btn"
              (click)="onClap()"
              [class.interact-btn--active]="hasClapped()"
              [title]="isGuest() ? 'Sign in to clap' : 'Clap for this article'"
            >
              <span [class.clap-burst]="clapAnimating()">
                {{ hasClapped() ? '❤️' : '♡' }}
              </span>
              {{ article().claps + (hasClapped() ? 1 : 0) }} {{ isGuest() ? '🔒' : '' }}
            </button>
            <button class="interact-btn">💬 {{ article().comments }}</button>
            <button
              class="interact-btn"
              [class.interact-btn--active]="bookmarked()"
              (click)="onBookmark()"
              [title]="isGuest() ? 'Sign in to bookmark' : 'Bookmark'"
            >
              🔖 {{ isGuest() ? '🔒' : '' }}
            </button>
            <button class="interact-btn">↗ Share</button>
          </div>
        </div>
      </header>

      <!-- ── COVER IMAGE ── -->
      <div class="post-cover">
        <div class="post-cover__inner">
          <img
            *ngIf="article().coverImageUrl"
            [src]="article().coverImageUrl"
            class="post-cover__img"
            alt="Cover Image"
          />
          <span *ngIf="!article().coverImageUrl" class="post-cover__emoji">
            {{ article().coverEmoji }}
          </span>
        </div>
        <div class="post-cover__overlay"></div>
        <div class="post-cover__caption">Cover image · InkWell</div>
      </div>

      <!-- ── PROSE CONTENT ── -->
      <div class="post-content" #contentEl [innerHTML]="formattedContent()"></div>

      <!-- ── TAGS + ENGAGEMENT ── -->
      <div class="post-engagement">
        <div class="post-engagement__tags">
          <a class="tag" routerLink="/feed" *ngFor="let tag of article().tags">{{ tag }}</a>
        </div>
        <div class="post-engagement__actions">
          <button
            class="clap-button"
            (click)="onClap()"
            [class.clap-button--active]="hasClapped()"
            title="Clap for this article"
          >
            <span class="clap-button__icon" [class.clap-burst]="clapAnimating()">
              {{ hasClapped() ? '❤️' : '♡' }}
            </span>
            <span class="clap-button__count">
              {{ article().claps + (hasClapped() ? 1 : 0) }} claps
            </span>
          </button>
          <button class="interact-btn">💬 {{ article().comments }} comments</button>
          <button class="interact-btn">↗ Share</button>
        </div>
      </div>

      <!-- ── AUTHOR CARD ── -->
      <div class="author-card">
        <div class="author-card__avatar avatar avatar-2xl" [style.background]="article().avatarGradient || 'linear-gradient(135deg,#c9893a,#9a5f1a)'">
          {{ article().initials || 'A' }}
        </div>
        <div class="author-card__body">
          <div class="author-card__eyebrow">Written by</div>
          <h3 class="author-card__name" (click)="router.navigate(['/profile', article().authorId])" style="cursor: pointer;">{{ article().author }}</h3>
          <p class="author-card__bio">{{ article().authorBio }}</p>
          <div class="author-card__stats">
            <div class="author-card__stat">
              <span class="author-card__stat-num">{{ (article().followerCount || 0) | number }}</span>
              <span class="author-card__stat-label">Followers</span>
            </div>
            <div class="author-card__stat">
              <span class="author-card__stat-num">{{ article().storyCount || 0 }}</span>
              <span class="author-card__stat-label">Stories</span>
            </div>
            <div class="author-card__stat">
              <span class="author-card__stat-num">{{ article().readCount || '0' }}</span>
              <span class="author-card__stat-label">Total reads</span>
            </div>
          </div>
          <div class="author-card__actions">
            <button
              class="follow-btn"
              [class.follow-btn--following]="article().isFollowing"
              (click)="toggleFollow()"
              [title]="isGuest() ? 'Sign in to follow' : ''"
            >
              {{ article().isFollowing ? '✓ Following' : (isGuest() ? 'Follow 🔒' : 'Follow') }}
            </button>
            <a class="btn btn-ghost btn-sm" [routerLink]="['/profile', article().authorId]">View profile →</a>
          </div>
        </div>
      </div>
      
      <!-- ── COMMENTS SECTION ── -->
      <section class="comments-section" id="comments">
        <div class="comments-header">
          <h2 class="comments-title">Responses ({{ comments().length }})</h2>
        </div>

        <!-- Add Comment Form -->
        <div class="comment-form" *ngIf="authSession.isAuthenticated(); else loginPrompt">
          <textarea
            class="comment-input"
            placeholder="What are your thoughts?"
            [(ngModel)]="newCommentContent"
          ></textarea>
          <div class="comment-form__actions">
            <button class="btn btn-brand btn-sm" [disabled]="!newCommentContent.trim()" (click)="submitComment()">
              Respond
            </button>
          </div>
        </div>

        <ng-template #loginPrompt>
          <div class="login-prompt">
            <p>Sign in to join the conversation.</p>
            <a routerLink="/login" class="btn btn-outline btn-sm">Sign In</a>
          </div>
        </ng-template>

        <!-- Comments List -->
        <div class="comments-list">
          <div class="comment-item" *ngFor="let comment of comments()">
            <div class="comment-item__header">
              <div class="avatar avatar-sm" style="background: var(--iw-bg-alt)">
                {{ (comment.authorName || 'U').charAt(0).toUpperCase() }}
              </div>
              <div class="comment-item__meta">
                <div class="comment-item__author">{{ comment.authorName || 'User' }}</div>
                <div class="comment-item__date">{{ comment.createdAt | date:'shortDate' }}</div>
              </div>
            </div>
            <div class="comment-item__body">
              {{ comment.content }}
            </div>
            <div class="comment-item__footer">
              <button class="interact-btn interact-btn--sm">♡ {{ comment.likes }}</button>
              <button class="interact-btn interact-btn--sm">Reply</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── MORE FROM AUTHOR ── -->
      <div class="more-section">
        <div class="more-section__header">
          <h2 class="more-section__title">More from {{ article().author }}</h2>
          <a class="see-all" [routerLink]="['/profile', article().authorId]">See all →</a>
        </div>
        <div class="more-grid">
          <a
            class="more-card"
            *ngFor="let related of relatedPosts"
            [routerLink]="['/blog', related.id]"
          >
            <div class="more-card__cover">
              <div class="more-card__emoji">{{ related.emoji }}</div>
            </div>
            <div class="more-card__body">
              <div class="more-card__meta">
                <span class="tag">{{ related.category }}</span>
                <span class="read-time">{{ related.readTime }}</span>
              </div>
              <h3 class="more-card__title">{{ related.title }}</h3>
              <p class="more-card__excerpt">{{ related.excerpt }}</p>
            </div>
          </a>
        </div>
      </div>

    </article>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* ════════════════════════════════
       READING PROGRESS BAR
    ════════════════════════════════ */
    .progress-track {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--iw-border);
      z-index: 200;
      pointer-events: none;
    }

    .progress-bar {
      height: 100%;
      background: var(--iw-brand-gradient);
      border-radius: 0 2px 2px 0;
      transition: width 0.08s linear;
      box-shadow: 0 0 8px var(--iw-brand-glow);
    }

    /* ════════════════════════════════
       STICKY AUTHOR BAR
    ════════════════════════════════ */
    .sticky-bar {
      position: fixed;
      top: 3px; /* sit right below the progress bar */
      left: 0;
      right: 0;
      z-index: 90;
      transform: translateY(-100%);
      opacity: 0;
      transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.3s ease;
      pointer-events: none;
    }

    .sticky-bar--visible {
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .sticky-bar__inner {
      max-width: 840px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px clamp(16px, 4vw, 48px);
      background: var(--iw-surface-strong);
      backdrop-filter: blur(24px) saturate(1.8);
      -webkit-backdrop-filter: blur(24px) saturate(1.8);
      border-bottom: 1px solid var(--iw-border);
      box-shadow: var(--iw-shadow-sm);
    }

    .sticky-bar__left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .sticky-bar__author {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--iw-ink-2);
      flex-shrink: 0;
    }

    .sticky-bar__title {
      font-size: 0.82rem;
      color: var(--iw-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    .sticky-bar__actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    /* ════════════════════════════════
       ARTICLE LAYOUT
    ════════════════════════════════ */
    .post-article {
      max-width: 740px;
      margin: 0 auto;
      padding: clamp(28px, 4vw, 52px) clamp(16px, 4vw, 32px) clamp(48px, 6vw, 80px);
    }

    /* ════════════════════════════════
       POST HEADER
    ════════════════════════════════ */
    .post-header {
      margin-bottom: 0;
    }

    .post-header__chips {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .post-heading {
      font-family: var(--font-display);
      font-size: clamp(30px, 5vw, 52px);
      font-weight: 500;
      letter-spacing: -0.04em;
      line-height: 1.07;
      color: var(--iw-ink);
      margin: 0 0 18px;
    }

    .post-lead {
      font-family: var(--font-prose);
      font-size: clamp(17px, 2vw, 21px);
      font-weight: 400;
      font-style: italic;
      color: var(--iw-muted);
      line-height: 1.6;
      margin: 0 0 28px;
    }

    /* Author bar */
    .post-author-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 0;
      border-top: 1px solid var(--iw-border);
      border-bottom: 1px solid var(--iw-border);
      flex-wrap: wrap;
    }

    .post-author-bar__info {
      flex: 1;
      min-width: 0;
    }

    .post-author-bar__name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--iw-ink);
    }

    .post-author-bar__meta {
      font-size: 0.8rem;
      color: var(--iw-muted);
      margin-top: 2px;
    }

    .post-author-bar__claps {
      color: var(--iw-brand);
      font-weight: 500;
    }

    .post-author-bar__actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* Shared interact button */
    .interact-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: var(--r-pill);
      border: 1px solid var(--iw-border);
      background: transparent;
      color: var(--iw-muted);
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--trans);
      white-space: nowrap;
    }

    .interact-btn:hover {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .interact-btn--active {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .interact-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 11px;
      border-radius: var(--r-pill);
      border: 1px solid var(--iw-border);
      background: transparent;
      color: var(--iw-muted);
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--trans);
    }

    .interact-pill:hover,
    .interact-pill--active {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .interact-pill__icon {
      font-size: 0.9rem;
      line-height: 1;
    }

    /* ════════════════════════════════
       COVER IMAGE
    ════════════════════════════════ */
    .post-cover {
      width: 100%;
      aspect-ratio: 2 / 1;
      border-radius: var(--r-xl);
      overflow: hidden;
      position: relative;
      margin: 32px 0 40px;
    }

    .post-cover__inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        135deg,
        var(--iw-brand-soft) 0%,
        var(--iw-bg-alt) 50%,
        rgba(42,138,106,0.08) 100%
      );
      transition: transform 6s ease;
    }

    .post-cover:hover .post-cover__inner {
      transform: scale(1.03);
    }

    .post-cover__emoji {
      font-size: clamp(4rem, 8vw, 7rem);
      user-select: none;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.12));
      z-index: 1;
    }

    .post-cover__img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 6s ease;
    }

    .post-cover:hover .post-cover__img {
      transform: scale(1.05);
    }

    .post-cover__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        transparent 50%,
        rgba(10, 8, 4, 0.08) 100%
      );
      pointer-events: none;
    }

    .post-cover__caption {
      position: absolute;
      bottom: 12px;
      right: 16px;
      font-size: 0.7rem;
      color: rgba(255,255,255,0.65);
      background: rgba(0,0,0,0.28);
      backdrop-filter: blur(4px);
      padding: 3px 9px;
      border-radius: 4px;
      font-family: var(--font-body);
    }

    /* ════════════════════════════════
       PROSE CONTENT
    ════════════════════════════════ */
    .post-content {
      font-family: var(--font-prose);
      font-size: clamp(1.1rem, 1.8vw, 1.25rem);
      font-weight: 400;
      line-height: 1.8;
      color: var(--iw-ink-2);
      letter-spacing: -0.011em;
    }

    .post-content p {
      margin: 0 0 1.8em;
    }

    .post-content p:last-child {
      margin-bottom: 0;
    }

    .post-content h2 {
      font-family: var(--font-display);
      font-size: clamp(1.6rem, 3.2vw, 2.2rem);
      letter-spacing: -0.045em;
      font-weight: 600;
      color: var(--iw-ink);
      margin: 2.2em 0 0.8em;
      line-height: 1.15;
    }

    .post-content h3 {
      font-family: var(--font-display);
      font-size: clamp(1.3rem, 2.2vw, 1.6rem);
      letter-spacing: -0.035em;
      font-weight: 600;
      color: var(--iw-ink);
      margin: 1.8em 0 0.7em;
    }

    .post-content strong {
      font-weight: 700;
      color: var(--iw-ink);
    }

    .post-content em {
      font-style: italic;
    }

    .post-content a {
      color: var(--iw-brand);
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
      transition: var(--trans);
    }

    .post-content a:hover {
      color: var(--iw-brand-deep);
      text-decoration-thickness: 2px;
    }

    /* Lists */
    .post-content ul, 
    .post-content ol {
      margin: 0 0 1.8em 1.2em;
      padding: 0;
    }

    .post-content li {
      margin-bottom: 0.8em;
      padding-left: 0.4em;
    }

    .post-content ul {
      list-style-type: none;
    }

    .post-content ul li {
      position: relative;
    }

    .post-content ul li::before {
      content: "•";
      color: var(--iw-brand);
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
      position: absolute;
    }

    .post-content ol {
      list-style-type: decimal;
      color: var(--iw-brand);
      font-weight: 600;
    }

    .post-content ol li {
      color: var(--iw-ink-2);
      font-weight: 400;
    }

    .post-content blockquote {
      border-left: 4px solid var(--iw-brand);
      padding: 4px 0 4px 28px;
      margin: 2.4em 0;
      font-style: italic;
      font-size: clamp(1.15rem, 2vw, 1.4rem);
      color: var(--iw-ink);
      line-height: 1.6;
      background: linear-gradient(90deg, var(--iw-brand-soft) 0%, transparent 100%);
      border-radius: 0 8px 8px 0;
    }

    .post-content code {
      font-family: var(--font-mono);
      font-size: 0.9em;
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      padding: 0.2em 0.5em;
      border-radius: 6px;
      color: var(--iw-brand);
    }

    .post-content pre {
      background: #121212;
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      padding: 24px;
      overflow-x: auto;
      margin: 2em 0;
      box-shadow: var(--iw-shadow-lg);
    }

    .post-content pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: 0.95rem;
      color: #e0e0e0;
      line-height: 1.6;
    }

    .post-content hr {
      border: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--iw-border), transparent);
      margin: 3em 0;
    }

    /* Drop-cap first paragraph */
    .post-content > p:first-child::first-letter {
      font-family: var(--font-display);
      font-size: 4.2rem;
      font-weight: 600;
      line-height: 0.8;
      float: left;
      margin: 0.1em 0.12em 0.1em 0;
      color: var(--iw-brand);
      text-transform: uppercase;
    }

    /* ════════════════════════════════
       ENGAGEMENT SECTION
    ════════════════════════════════ */
    .post-engagement {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid var(--iw-border);
    }

    .post-engagement__tags {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
    }

    .post-engagement__tags .tag {
      cursor: pointer;
      text-decoration: none;
      transition: var(--trans);
    }

    .post-engagement__tags .tag:hover {
      background: var(--iw-brand);
      color: white;
    }

    .post-engagement__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* ── BIG CLAP BUTTON ── */
    .clap-button {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 10px 20px;
      border-radius: var(--r-pill);
      border: 1.5px solid var(--iw-border-2);
      background: var(--iw-surface);
      color: var(--iw-muted);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--trans);
      backdrop-filter: blur(8px);
    }

    .clap-button:hover {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
      transform: translateY(-1px);
      box-shadow: var(--iw-shadow-sm);
    }

    .clap-button--active {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .clap-button__icon {
      font-size: 1.1rem;
      display: inline-block;
      transition: transform 0.15s ease;
    }

    .clap-button--active .clap-button__icon {
      transform: scale(1.2);
    }

    .clap-button__count {
      font-weight: 600;
    }

    /* Burst animation class */
    .clap-burst {
      animation: clapBurst 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* ════════════════════════════════
       AUTHOR CARD
    ════════════════════════════════ */
    .author-card {
      display: flex;
      gap: 24px;
      padding: 32px;
      background: var(--iw-surface);
      backdrop-filter: blur(14px) saturate(1.5);
      -webkit-backdrop-filter: blur(14px) saturate(1.5);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-xl);
      margin-top: 48px;
      box-shadow: var(--iw-shadow-sm);
    }

    .author-card__avatar {
      flex-shrink: 0;
    }

    .author-card__body {
      flex: 1;
      min-width: 0;
    }

    .author-card__eyebrow {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--iw-faint);
      margin-bottom: 5px;
    }

    .author-card__name {
      font-family: var(--font-display);
      font-size: 1.5rem;
      letter-spacing: -0.03em;
      color: var(--iw-ink);
      margin: 0 0 10px;
    }

    .author-card__bio {
      font-size: 0.9rem;
      color: var(--iw-muted);
      line-height: 1.65;
      margin: 0 0 18px;
    }

    .author-card__stats {
      display: flex;
      gap: 24px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .author-card__stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .author-card__stat-num {
      font-family: var(--font-display);
      font-size: 1.25rem;
      letter-spacing: -0.04em;
      color: var(--iw-ink);
      line-height: 1;
    }

    .author-card__stat-label {
      font-size: 0.72rem;
      color: var(--iw-muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .author-card__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .follow-btn {
      padding: 9px 22px;
      border-radius: var(--r-pill);
      font-size: 0.85rem;
      font-weight: 700;
      border: 1.5px solid var(--iw-brand);
      color: var(--iw-brand);
      background: transparent;
      cursor: pointer;
      transition: var(--trans);
    }

    .follow-btn:hover {
      background: var(--iw-brand);
      color: white;
    }

    .follow-btn--following {
      background: var(--iw-brand-soft);
    }

    /* ════════════════════════════════
       MORE FROM AUTHOR
    ════════════════════════════════ */
    .more-section {
      margin-top: 56px;
    }

    .more-section__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .more-section__title {
      font-family: var(--font-display);
      font-size: clamp(1.3rem, 2.5vw, 1.7rem);
      letter-spacing: -0.03em;
      color: var(--iw-ink);
      margin: 0;
    }

    .more-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }

    .more-card {
      display: flex;
      flex-direction: column;
      background: var(--iw-surface);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: var(--trans);
      box-shadow: var(--iw-shadow-sm);
    }

    .more-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--iw-shadow-md);
      border-color: var(--iw-border-2);
    }

    .more-card__cover {
      width: 100%;
      aspect-ratio: 16 / 7;
      background: linear-gradient(135deg, var(--iw-brand-soft), var(--iw-bg-alt));
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .more-card__emoji {
      font-size: 2.2rem;
      transition: transform 0.4s ease;
    }

    .more-card:hover .more-card__emoji {
      transform: scale(1.15);
    }

    .more-card__body {
      padding: 16px;
    }

    .more-card__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .more-card__title {
      font-family: var(--font-display);
      font-size: 1rem;
      letter-spacing: -0.02em;
      line-height: 1.3;
      color: var(--iw-ink);
      margin: 0 0 8px;
      transition: color 0.18s ease;
    }

    .more-card:hover .more-card__title {
      color: var(--iw-brand);
    }

    .more-card__excerpt {
      font-size: 0.82rem;
      color: var(--iw-muted);
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ════════════════════════════════
       RESPONSIVE
    ════════════════════════════════ */
    @media (max-width: 680px) {
      .post-author-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .post-author-bar__actions {
        width: 100%;
      }

      .author-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 24px;
      }

      .author-card__stats {
        justify-content: center;
      }

      .author-card__actions {
        justify-content: center;
      }

      .more-grid {
        grid-template-columns: 1fr;
      }

      .post-engagement {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .sticky-bar__title {
        display: none;
      }

      .post-cover {
        aspect-ratio: 16 / 9;
        border-radius: var(--r-lg);
      }
    }

    @media (max-width: 480px) {
      .post-content > p:first-child::first-letter {
        font-size: 3.2em;
      }
    }

    /* ════════════════════════════════
       COMMENTS SECTION
    ════════════════════════════════ */
    .comments-section {
      margin-top: 48px;
      padding-top: 48px;
      border-top: 1px solid var(--iw-border);
    }

    .comments-title {
      font-family: var(--font-display);
      font-size: 1.5rem;
      color: var(--iw-ink);
      margin-bottom: 24px;
    }

    .comment-form {
      margin-bottom: 32px;
      padding: 20px;
      background: var(--iw-surface);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      box-shadow: var(--iw-shadow-sm);
    }

    .comment-input {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      background: transparent;
      border: none;
      font-family: var(--font-body);
      font-size: 0.95rem;
      color: var(--iw-ink);
      resize: vertical;
      outline: none;
    }

    .comment-form__actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--iw-border);
    }

    .login-prompt {
      padding: 32px;
      text-align: center;
      background: var(--iw-bg-alt);
      border-radius: var(--r-lg);
      margin-bottom: 32px;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .comment-item {
      padding-bottom: 24px;
      border-bottom: 1px solid var(--iw-border);
    }

    .comment-item__header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .comment-item__author {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--iw-ink);
    }

    .comment-item__date {
      font-size: 0.75rem;
      color: var(--iw-muted);
    }

    .comment-item__body {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--iw-ink-2);
      margin-bottom: 12px;
    }

    .interact-btn--sm {
      padding: 4px 8px;
      font-size: 0.7rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailPageComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly authSession = inject(AuthSessionService);
  protected readonly router = inject(Router);
  private readonly postApiService = inject(PostApiService);
  private readonly commentApiService = inject(CommentApiService);
  private readonly authApiService = inject(AuthApiService);

  @ViewChild('headerEl') headerEl!: ElementRef<HTMLElement>;
  @ViewChild('articleEl') articleEl!: ElementRef<HTMLElement>;
  @ViewChild('contentEl') contentEl!: ElementRef<HTMLElement>;

  /* ── Reading progress (0-100) ── */
  readonly readProgress = signal(0);
  readonly showStickyBar = signal(false);
  readonly hasClapped = signal(false);
  readonly bookmarked = signal(false);
  readonly isLoading = signal(false);
  readonly clapAnimating = signal(false);

  private clapTimer: ReturnType<typeof setTimeout> | null = null;

  /* ── Article data ── */
  readonly article = signal<any>({
    title: 'Loading...',
    summary: 'Please wait...',
    author: 'InkWell',
    claps: 0,
    comments: 0
  });

  readonly formattedContent = computed(() => {
    const raw = this.article().content || this.article().body || '';
    if (!raw) return '';

    // If it looks like HTML, return as-is
    if (/<[a-z][\s\S]*>/i.test(raw)) {
      return raw;
    }

    // Basic markdown-style parser
    let formatted = raw
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Links [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="post-hr">');

    // Split into blocks (paragraphs or lists)
    const blocks = formatted.split(/\n\s*\n/);
    
    return blocks.map((block: string) => {
      const trimmed = block.trim();
      const lines = trimmed.split('\n');
      
      // Check if it's a blockquote
      if (trimmed.startsWith('> ')) {
        const quoteContent = lines.map((line: string) => line.replace(/^>\s?/, '')).join('<br>');
        return `<blockquote>${quoteContent}</blockquote>`;
      }

      // Check if it's a bullet list
      if (lines.every((line: string) => /^[\*\-]\s/.test(line.trim()))) {
        const items = lines.map((line: string) => `<li>${line.trim().replace(/^[\*\-]\s/, '')}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      
      // Check if it's a numbered list
      if (lines.every((line: string) => /^\d+\.\s/.test(line.trim()))) {
        const items = lines.map((line: string) => `<li>${line.trim().replace(/^\d+\.\s/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
      
      // Otherwise it's a paragraph
      return `<p>${block.trim().replace(/\n/g, '<br>')}</p>`;
    }).join('');
  });

  readonly comments = signal<Comment[]>([]);
  newCommentContent = '';

  protected readonly relatedPosts = [
    {
      id: 'slow-reading',
      title: 'The Joy of Slow Reading in a Fast World',
      excerpt: 'On savouring pages instead of skimming headlines, and what we lose when we stop.',
      category: 'Wellness',
      readTime: '5 min read',
      emoji: '📚',
    },
    {
      id: 'on-not-knowing',
      title: 'On Not Knowing: A Defense of Uncertainty',
      excerpt: 'In a world that demands opinions on everything, sometimes the most honest answer is silence.',
      category: 'Philosophy',
      readTime: '6 min read',
      emoji: '🌀',
    },
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.fetchPost(id);
        this.fetchComments(id);
      }
    }
  }

  readonly isGuest = computed(() => !this.authSession.isAuthenticated());

  private fetchPost(id: string): void {
    this.postApiService.getPost(id).subscribe({
      next: (post: any) => {
        const authorName = post.authorName || "InkWell Author";
        const initials = authorName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        
        const authorId = post.authorId || 1;
        const coverImageUrl = post.coverImageUrl || post.coverUrl || post.featuredImageUrl || post.thumbnailUrl;
        
        this.article.set({
          ...post,
          author: authorName,
          initials: initials,
          authorId: authorId,
          coverImageUrl: coverImageUrl,
          coverEmoji: post.category?.name === "Technology" ? "💻" : 
                      post.category?.name === "Science" ? "🧪" : 
                      post.category?.name === "Philosophy" ? "🌀" : 
                      post.category?.name === "Culture" ? "🎨" : "📝",
          published: new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          claps: post.likeCount || 0,
        });

        // Check bookmark status
        const user = this.authSession.user();
        if (user) {
          this.postApiService.isBookmarked(id, user.userId).subscribe(is => this.bookmarked.set(is));
        }

        // Fetch additional author data
        this.fetchAuthorStats(authorId);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private fetchAuthorStats(authorId: number): void {
    // Get author profile for bio and followers
    this.authApiService.getUserProfile(authorId).subscribe({
      next: (profile) => {
        this.article.update(a => ({
          ...a,
          authorBio: profile.bio || "InkWell featured author and storyteller.",
          followerCount: profile.followerCount || 0,
          isFollowing: profile.isFollowing || false,
          avatarUrl: profile.avatarUrl || a.avatarUrl
        }));

        // Check following status if logged in
        if (this.authSession.isAuthenticated()) {
          this.authApiService.isFollowing(authorId).subscribe(res => {
            this.article.update(a => ({ ...a, isFollowing: res.following }));
          });
        }
      }
    });

    // Get author posts for story count and total reads
    this.postApiService.listAuthorPosts(authorId).subscribe({
      next: (posts: any[]) => {
        const totalReads = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
        this.article.update(a => ({
          ...a,
          storyCount: posts.length,
          readCount: totalReads > 1000 ? (totalReads / 1000).toFixed(1) + "K" : totalReads.toString()
        }));
      }
    });
  }

  private fetchComments(postId: string): void {
    this.commentApiService.getCommentsByPost(postId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.article.update(a => ({ ...a, comments: comments.length }));
        this.cdr.markForCheck();
      }
    });
  }

  submitComment(): void {
    if (!this.newCommentContent.trim()) return;

    const user = this.authSession.user();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const comment: Partial<Comment> = {
      postId: this.article().id,
      content: this.newCommentContent,
      authorId: user.userId,
      authorName: user.fullName || user.username || 'User'
    };

    this.commentApiService.addComment(comment).subscribe({
      next: (newComment) => {
        this.comments.update(list => [newComment, ...list]);
        this.newCommentContent = '';
        this.article.update(a => ({ ...a, comments: a.comments + 1 }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to add comment:', err);
        // Could add a toast notification here
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      /* Trigger initial scroll calc */
      this.onScroll();
    }
  }

  ngOnDestroy(): void {
    if (this.clapTimer) clearTimeout(this.clapTimer);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;

    /* Reading progress */
    this.readProgress.set(docH > 0 ? Math.min((scrollY / docH) * 100, 100) : 0);

    /* Sticky bar: show after header leaves viewport */
    const headerBottom = this.headerEl?.nativeElement?.getBoundingClientRect().bottom ?? 0;
    this.showStickyBar.set(headerBottom < 80);

    this.cdr.markForCheck();
  }

  onClap(): void {
    if (!this.authSession.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const isLiking = !this.hasClapped();
    const action$ = isLiking 
      ? this.postApiService.likePost(this.article().id)
      : this.postApiService.unlikePost(this.article().id);

    action$.subscribe({
      next: () => {
        this.hasClapped.update(v => !v);
        this.article.update(a => ({ ...a, claps: isLiking ? a.claps + 1 : a.claps - 1 }));
        this.clapAnimating.set(true);
        if (this.clapTimer) clearTimeout(this.clapTimer);
        this.clapTimer = setTimeout(() => {
          this.clapAnimating.set(false);
          this.cdr.markForCheck();
        }, 450);
      }
    });
  }

  toggleFollow(): void {
    if (this.isGuest()) {
      void this.router.navigate(['/login']);
      return;
    }

    const authorId = this.article().authorId;
    if (!authorId) return;

    if (this.article().isFollowing) {
      this.authApiService.unfollowUser(authorId).subscribe(() => {
        this.article.update(a => ({ 
          ...a, 
          isFollowing: false, 
          followerCount: Math.max(0, (a.followerCount || 0) - 1) 
        }));
      });
    } else {
      this.authApiService.followUser(authorId).subscribe(() => {
        this.article.update(a => ({ 
          ...a, 
          isFollowing: true, 
          followerCount: (a.followerCount || 0) + 1 
        }));
      });
    }
  }

  onBookmark(): void {
    const user = this.authSession.user();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const isAdding = !this.bookmarked();
    const action$ = isAdding
      ? this.postApiService.bookmarkPost(this.article().id, user.userId)
      : this.postApiService.unbookmarkPost(this.article().id, user.userId);

    action$.subscribe({
      next: () => {
        this.bookmarked.update(v => !v);
      }
    });
  }
}
