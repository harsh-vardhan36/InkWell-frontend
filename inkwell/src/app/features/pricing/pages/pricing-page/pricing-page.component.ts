import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ComparisonRow {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  publication: boolean | string;
}

interface ComparisonGroup {
  label: string;
  rows: ComparisonRow[];
}

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ═══════════════════════════════════════════════
         READING PROGRESS BAR
    ═══════════════════════════════════════════════ -->
    <div class="progress-bar" [style.width.%]="scrollProgress()"></div>

    <div class="pricing-page">

      <!-- ═══════════════════════════════════════════════
           HERO HEADER
      ═══════════════════════════════════════════════ -->
      <section class="pricing-hero">
        <div class="hero-orb orb-1"></div>
        <div class="hero-orb orb-2"></div>
        <div class="hero-orb orb-3"></div>
        <div class="hero-watermark">₹</div>

        <div class="hero-inner">
          <div class="eyebrow-pill">
            <span class="eyebrow-dot"></span>
            Simple, Transparent Pricing
          </div>

          <h1 class="hero-title">
            Invest in your<br>
            <em class="title-italic">creative future</em>
          </h1>

          <p class="hero-subtitle">
            Start free, grow as you write. Every plan includes access to
            InkWell's editor, community, and analytics.
          </p>

          <!-- Billing Toggle -->
          <div class="billing-toggle">
            <span class="toggle-label" [class.active]="!isYearly()">Monthly</span>
            <button class="toggle-switch" (click)="toggleBilling()" [class.yearly]="isYearly()" aria-label="Toggle billing period">
              <span class="toggle-thumb"></span>
            </button>
            <span class="toggle-label" [class.active]="isYearly()">
              Yearly
              <span class="save-badge">Save 30%</span>
            </span>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           TRIAL BANNER
      ═══════════════════════════════════════════════ -->
      <div class="trial-banner">
        <div class="trial-banner-inner">
          <div class="trial-icon">⚡</div>
          <div class="trial-text">
            <strong>Try Pro for just ₹2</strong>
            <span>— Full access for 15 days. No commitment, cancel anytime.</span>
          </div>
          <a routerLink="/register" class="trial-cta">Start ₹2 Trial →</a>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           PLAN CARDS
      ═══════════════════════════════════════════════ -->
      <section class="plans-section">
        <div class="plans-grid">

          <!-- FREE PLAN -->
          <div class="plan-card plan-free" [class.reveal]="cardsVisible()">
            <div class="plan-header">
              <div class="plan-icon">✦</div>
              <h2 class="plan-name">Free</h2>
              <p class="plan-tagline">Start your writing journey</p>
              <div class="plan-price">
                <span class="price-amount">₹0</span>
                <span class="price-period">forever</span>
              </div>
            </div>

            <div class="plan-features">
              <div class="feature-item" *ngFor="let f of freeFeatures">
                <span class="feature-check check-free">✓</span>
                <span>{{ f }}</span>
              </div>
              <div class="feature-item feature-missing">
                <span class="feature-x">✕</span>
                <span>Newsletter to subscribers</span>
              </div>
              <div class="feature-item feature-missing">
                <span class="feature-x">✕</span>
                <span>Priority support</span>
              </div>
              <div class="feature-item feature-missing">
                <span class="feature-x">✕</span>
                <span>Custom domain</span>
              </div>
              <div class="feature-item feature-missing">
                <span class="feature-x">✕</span>
                <span>Advanced analytics</span>
              </div>
              <div class="feature-item feature-missing">
                <span class="feature-x">✕</span>
                <span>Monetization tools</span>
              </div>
            </div>

            <a routerLink="/register" class="plan-cta plan-cta--ghost">
              Get started free
            </a>
          </div>

          <!-- PRO PLAN (POPULAR) -->
          <div class="plan-card plan-pro plan-featured" [class.reveal]="cardsVisible()">
            <div class="popular-badge">
              <span>★ Most Popular</span>
            </div>
            <div class="plan-glow"></div>

            <div class="plan-header">
              <div class="plan-icon plan-icon--amber">◆</div>
              <h2 class="plan-name">Pro</h2>
              <p class="plan-tagline">For serious writers & creators</p>
              <div class="plan-price">
                <div class="price-with-trial">
                  <div class="trial-chip">₹2 for 15 days →</div>
                </div>
                <span class="price-amount">
                  {{ isYearly() ? '₹499' : '₹599' }}
                </span>
                <span class="price-period">/ month</span>
              </div>
              <p class="price-note" *ngIf="isYearly()">Billed ₹5,988/year · Save ₹2,400</p>
              <p class="price-note" *ngIf="!isYearly()">Billed monthly · Cancel anytime</p>
            </div>

            <div class="plan-features">
              <div class="feature-item" *ngFor="let f of proFeatures">
                <span class="feature-check check-amber">✓</span>
                <span [class.feature-highlight]="f.highlight">{{ f.text }}</span>
              </div>
            </div>

            <a routerLink="/register" class="plan-cta plan-cta--amber">
              <span class="cta-text">Start ₹2 Trial</span>
              <span class="cta-shimmer"></span>
            </a>
            <p class="cta-note">No credit card games · Cancel anytime</p>
          </div>

          <!-- PUBLICATION PLAN -->
          <div class="plan-card plan-publication" [class.reveal]="cardsVisible()">
            <div class="plan-header">
              <div class="plan-icon plan-icon--emerald">❋</div>
              <h2 class="plan-name">Publication</h2>
              <p class="plan-tagline">For teams & media brands</p>
              <div class="plan-price">
                <span class="price-amount">
                  {{ isYearly() ? '₹1,299' : '₹1,599' }}
                </span>
                <span class="price-period">/ month</span>
              </div>
              <p class="price-note" *ngIf="isYearly()">Billed ₹15,588/year · Save ₹3,600</p>
              <p class="price-note" *ngIf="!isYearly()">Up to 5 team members</p>
            </div>

            <div class="plan-features">
              <div class="feature-item" *ngFor="let f of publicationFeatures">
                <span class="feature-check check-emerald">✓</span>
                <span [class.feature-highlight]="f.highlight">{{ f.text }}</span>
              </div>
            </div>

            <a routerLink="/contact" class="plan-cta plan-cta--emerald">
              <span class="cta-text">Contact Sales</span>
              <span class="cta-shimmer"></span>
            </a>
            <p class="cta-note">Custom onboarding · Dedicated support</p>
          </div>

        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           FEATURE COMPARISON TABLE
      ═══════════════════════════════════════════════ -->
      <section class="comparison-section">
        <div class="section-header">
          <h2 class="section-title">Compare every feature</h2>
          <p class="section-subtitle">See exactly what you get with each plan</p>
        </div>

        <div class="comparison-table">
          <!-- Table Header -->
          <div class="comparison-header">
            <div class="compare-feature-col">Feature</div>
            <div class="compare-plan-col">Free</div>
            <div class="compare-plan-col compare-plan-pro">Pro <span class="col-badge">Popular</span></div>
            <div class="compare-plan-col compare-plan-pub">Publication</div>
          </div>

          <!-- Table Groups -->
          <div class="compare-group" *ngFor="let group of comparisonGroups">
            <div class="compare-group-label">{{ group.label }}</div>
            <div class="compare-row" *ngFor="let row of group.rows; let odd = odd" [class.compare-row-alt]="odd">
              <div class="compare-feature-col">{{ row.feature }}</div>
              <div class="compare-plan-col">
                <span *ngIf="row.free === true" class="cell-check">✓</span>
                <span *ngIf="row.free === false" class="cell-x">—</span>
                <span *ngIf="row.free !== true && row.free !== false" class="cell-text">{{ row.free }}</span>
              </div>
              <div class="compare-plan-col compare-plan-pro">
                <span *ngIf="row.pro === true" class="cell-check cell-check-amber">✓</span>
                <span *ngIf="row.pro === false" class="cell-x">—</span>
                <span *ngIf="row.pro !== true && row.pro !== false" class="cell-text cell-text-amber">{{ row.pro }}</span>
              </div>
              <div class="compare-plan-col compare-plan-pub">
                <span *ngIf="row.publication === true" class="cell-check cell-check-emerald">✓</span>
                <span *ngIf="row.publication === false" class="cell-x">—</span>
                <span *ngIf="row.publication !== true && row.publication !== false" class="cell-text cell-text-emerald">{{ row.publication }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           SOCIAL PROOF STRIP
      ═══════════════════════════════════════════════ -->
      <section class="proof-strip">
        <div class="proof-inner">
          <div class="proof-stat" *ngFor="let stat of proofStats">
            <div class="proof-number">{{ stat.number }}</div>
            <div class="proof-label">{{ stat.label }}</div>
          </div>
        </div>
        <div class="proof-logos">
          <span class="proof-logo-label">Trusted by writers from</span>
          <div class="proof-logos-list">
            <span *ngFor="let logo of trustedBrands" class="proof-brand">{{ logo }}</span>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           TESTIMONIALS
      ═══════════════════════════════════════════════ -->
      <section class="testimonials-section">
        <div class="section-header">
          <h2 class="section-title">Loved by writers</h2>
          <p class="section-subtitle">Join thousands of creators who chose InkWell</p>
        </div>

        <div class="testimonials-grid">
          <div class="testimonial-card" *ngFor="let t of testimonials">
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">{{ t.text }}</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">{{ t.avatar }}</div>
              <div class="testimonial-info">
                <div class="testimonial-name">{{ t.name }}</div>
                <div class="testimonial-role">{{ t.role }}</div>
              </div>
              <div class="testimonial-plan" [class]="'plan-badge-' + t.plan">{{ t.plan }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           FAQ ACCORDION
      ═══════════════════════════════════════════════ -->
      <section class="faq-section">
        <div class="faq-inner">
          <div class="faq-left">
            <div class="eyebrow-pill eyebrow-pill--sm">Got questions?</div>
            <h2 class="faq-title">Frequently<br><em>asked</em></h2>
            <p class="faq-subtitle">Can't find your answer? <a class="faq-link" routerLink="/contact">Chat with us →</a></p>
            <div class="faq-decoration">?</div>
          </div>

          <div class="faq-right">
            <div class="faq-item" *ngFor="let faq of faqs; let i = index" (click)="toggleFaq(i)">
              <div class="faq-question" [class.faq-open]="faq.open">
                <span>{{ faq.question }}</span>
                <span class="faq-chevron" [class.rotated]="faq.open">›</span>
              </div>
              <div class="faq-answer" [class.faq-answer-open]="faq.open">
                <div class="faq-answer-inner">{{ faq.answer }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════
           BOTTOM CTA BAND
      ═══════════════════════════════════════════════ -->
      <section class="cta-band">
        <div class="cta-shine"></div>
        <div class="cta-band-inner">
          <div class="cta-left">
            <h2 class="cta-title">Your stories deserve<br><em>to be read.</em></h2>
            <p class="cta-body">Start with ₹2 for 15 days. Experience everything Pro has to offer — newsletters, analytics, monetization — then decide.</p>
          </div>
          <div class="cta-right">
            <a routerLink="/register" class="btn-cta-main">
              <span>Start ₹2 Trial</span>
              <span class="btn-arrow">→</span>
            </a>
            <a routerLink="/register" class="btn-cta-ghost">Create free account</a>
            <p class="cta-disclaimer">₹2 charged once · Full Pro access · Cancel anytime</p>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       PROGRESS BAR
    ═══════════════════════════════════════════ */
    .progress-bar {
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--iw-brand), #f0b870);
      box-shadow: 0 0 12px var(--iw-brand-glow);
      z-index: 200;
      transition: width 0.08s linear;
    }

    /* ═══════════════════════════════════════════
       PAGE WRAPPER
    ═══════════════════════════════════════════ */
    .pricing-page {
      background: var(--iw-bg);
      color: var(--iw-ink);
      font-family: var(--font-body);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ═══════════════════════════════════════════
       HERO
    ═══════════════════════════════════════════ */
    .pricing-hero {
      position: relative;
      padding: 140px 24px 100px;
      text-align: center;
      overflow: hidden;
    }

    .hero-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.18;
      pointer-events: none;
      animation: floatOrb 8s ease-in-out infinite;
    }
    .orb-1 {
      width: 500px; height: 500px;
      background: var(--iw-brand);
      top: -100px; left: -150px;
      animation-delay: 0s;
    }
    .orb-2 {
      width: 400px; height: 400px;
      background: #2a8a6a;
      top: -80px; right: -100px;
      animation-delay: -3s;
    }
    .orb-3 {
      width: 350px; height: 350px;
      background: var(--iw-brand);
      bottom: -100px; left: 50%;
      transform: translateX(-50%);
      animation-delay: -5s;
    }
    @keyframes floatOrb {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-20px) scale(1.05); }
    }

    .hero-watermark {
      position: absolute;
      font-family: var(--font-display);
      font-size: clamp(160px, 22vw, 320px);
      font-weight: 900;
      color: var(--iw-brand);
      opacity: 0.04;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      user-select: none;
      line-height: 1;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
      max-width: 680px;
      margin: 0 auto;
    }

    .eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--iw-brand-soft);
      border: 1px solid var(--iw-brand-glow);
      color: var(--iw-brand);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 100px;
      margin-bottom: 28px;
      animation: fadeUp 0.6s ease both;
    }

    .eyebrow-pill--sm {
      font-size: 0.72rem;
      margin-bottom: 16px;
    }

    .eyebrow-dot {
      width: 6px; height: 6px;
      background: var(--iw-brand);
      border-radius: 50%;
      animation: pulseDot 2s ease-in-out infinite;
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(42px, 6vw, 80px);
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--iw-ink);
      margin: 0 0 20px;
      animation: fadeUp 0.6s 0.1s ease both;
    }

    .title-italic {
      font-style: italic;
      color: var(--iw-brand);
    }

    .hero-subtitle {
      font-family: var(--font-prose);
      font-size: 1.15rem;
      color: var(--iw-ink-muted);
      line-height: 1.7;
      margin: 0 0 40px;
      animation: fadeUp 0.6s 0.2s ease both;
    }

    /* ═══════════════════════════════════════════
       BILLING TOGGLE
    ═══════════════════════════════════════════ */
    .billing-toggle {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      animation: fadeUp 0.6s 0.3s ease both;
    }

    .toggle-label {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--iw-ink-muted);
      transition: color 0.25s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toggle-label.active {
      color: var(--iw-ink);
      font-weight: 700;
    }

    .toggle-switch {
      position: relative;
      width: 52px; height: 28px;
      background: var(--iw-border);
      border: none;
      border-radius: 100px;
      cursor: pointer;
      transition: background 0.3s;
      padding: 0;
    }
    .toggle-switch.yearly {
      background: var(--iw-brand);
    }

    .toggle-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 22px; height: 22px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .toggle-switch.yearly .toggle-thumb {
      transform: translateX(24px);
    }

    .save-badge {
      background: #2a8a6a;
      color: #fff;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: 100px;
      text-transform: uppercase;
    }

    /* ═══════════════════════════════════════════
       TRIAL BANNER
    ═══════════════════════════════════════════ */
    .trial-banner {
      background: linear-gradient(135deg, #1a3a2a 0%, #2a8a6a 100%);
      padding: 0 24px;
    }

    .trial-banner-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 18px 0;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .trial-icon {
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .trial-text {
      flex: 1;
      min-width: 200px;
      color: rgba(255,255,255,0.9);
      font-size: 0.95rem;
    }
    .trial-text strong {
      color: #fff;
      font-weight: 800;
      font-size: 1rem;
    }

    .trial-cta {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      padding: 9px 22px;
      border-radius: 100px;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .trial-cta:hover {
      background: rgba(255,255,255,0.25);
      transform: translateY(-1px);
    }

    /* ═══════════════════════════════════════════
       PLANS GRID
    ═══════════════════════════════════════════ */
    .plans-section {
      padding: 80px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: 1fr 1.1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    /* Plan Card Base */
    .plan-card {
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: 24px;
      padding: 40px 36px;
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease;
    }
    .plan-card:nth-child(1) { transition-delay: 0s; }
    .plan-card:nth-child(2) { transition-delay: 0.12s; }
    .plan-card:nth-child(3) { transition-delay: 0.24s; }

    .plan-card.reveal {
      opacity: 1;
      transform: translateY(0);
    }

    .plan-card:hover {
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }

    .plan-icon {
      font-size: 1.6rem;
      margin-bottom: 12px;
      display: block;
    }
    .plan-icon--amber { color: var(--iw-brand); }
    .plan-icon--emerald { color: #2a8a6a; }

    .plan-name {
      font-family: var(--font-display);
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--iw-ink);
    }

    .plan-tagline {
      font-size: 0.88rem;
      color: var(--iw-ink-muted);
      margin: 0 0 28px;
    }

    .plan-price {
      margin-bottom: 8px;
    }

    .price-with-trial {
      margin-bottom: 8px;
    }

    .trial-chip {
      display: inline-block;
      background: rgba(42, 138, 106, 0.12);
      border: 1px solid rgba(42, 138, 106, 0.3);
      color: #2a8a6a;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 100px;
    }

    .price-amount {
      font-family: var(--font-display);
      font-size: 2.8rem;
      font-weight: 700;
      color: var(--iw-ink);
      line-height: 1;
    }

    .price-period {
      font-size: 0.9rem;
      color: var(--iw-ink-muted);
      margin-left: 4px;
    }

    .price-note {
      font-size: 0.78rem;
      color: var(--iw-ink-muted);
      margin: 6px 0 0;
    }

    /* Features list */
    .plan-features {
      margin: 32px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.9rem;
      color: var(--iw-ink);
      line-height: 1.5;
    }

    .feature-item.feature-missing {
      color: var(--iw-ink-muted);
      opacity: 0.6;
    }

    .feature-check {
      font-size: 0.9rem;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .check-free { color: var(--iw-ink-muted); }
    .check-amber { color: var(--iw-brand); }
    .check-emerald { color: #2a8a6a; }

    .feature-x {
      color: var(--iw-ink-muted);
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 0.85rem;
    }

    .feature-highlight {
      font-weight: 600;
      color: var(--iw-ink);
    }

    /* CTAs */
    .plan-cta {
      display: block;
      width: 100%;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      transition: all 0.25s;
      position: relative;
      overflow: hidden;
    }

    .plan-cta--ghost {
      background: transparent;
      border: 1.5px solid var(--iw-border);
      color: var(--iw-ink);
    }
    .plan-cta--ghost:hover {
      border-color: var(--iw-brand);
      color: var(--iw-brand);
      background: var(--iw-brand-soft);
    }

    .plan-cta--amber {
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand), #f0b870);
      background-size: 200% 200%;
      color: #fff;
      border: none;
      box-shadow: 0 4px 20px var(--iw-brand-glow);
    }
    .plan-cta--amber:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px var(--iw-brand-glow);
    }

    .plan-cta--emerald {
      background: linear-gradient(135deg, #1a6a50, #2a8a6a, #4ecaa0);
      background-size: 200% 200%;
      color: #fff;
      border: none;
      box-shadow: 0 4px 20px rgba(42,138,106,0.3);
    }
    .plan-cta--emerald:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(42,138,106,0.4);
    }

    .cta-shimmer {
      position: absolute;
      top: 0; left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
      transform: skewX(-20deg);
      transition: left 0.5s;
    }
    .plan-cta:hover .cta-shimmer {
      left: 150%;
    }

    .cta-text { position: relative; z-index: 1; }
    .cta-note {
      text-align: center;
      font-size: 0.72rem;
      color: var(--iw-ink-muted);
      margin: 10px 0 0;
    }

    /* Featured card overrides */
    .plan-featured {
      border-color: var(--iw-brand);
      border-width: 1.5px;
      margin-top: -16px;
      box-shadow: 0 8px 40px var(--iw-brand-glow);
    }

    .plan-glow {
      position: absolute;
      top: -60px; right: -60px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, var(--iw-brand-glow), transparent 70%);
      pointer-events: none;
    }

    .popular-badge {
      position: absolute;
      top: 20px; right: 20px;
      background: var(--iw-brand);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 4px 12px;
      border-radius: 100px;
    }

    /* ═══════════════════════════════════════════
       COMPARISON TABLE
    ═══════════════════════════════════════════ */
    .comparison-section {
      padding: 80px 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title {
      font-family: var(--font-display);
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 700;
      color: var(--iw-ink);
      margin: 0 0 12px;
    }

    .section-subtitle {
      font-size: 1rem;
      color: var(--iw-ink-muted);
      margin: 0;
    }

    .comparison-table {
      border: 1px solid var(--iw-border);
      border-radius: 20px;
      overflow: hidden;
    }

    .comparison-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      background: var(--iw-bg-alt);
      border-bottom: 2px solid var(--iw-border);
      padding: 0;
    }

    .compare-feature-col,
    .compare-plan-col {
      padding: 18px 20px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--iw-ink-muted);
    }

    .compare-plan-col {
      text-align: center;
    }
    .compare-plan-pro {
      background: rgba(201, 137, 58, 0.06);
      border-left: 1px solid var(--iw-border);
      border-right: 1px solid var(--iw-border);
      color: var(--iw-brand) !important;
    }
    .compare-plan-pub {
      color: #2a8a6a !important;
    }

    .col-badge {
      display: inline-block;
      background: var(--iw-brand);
      color: #fff;
      font-size: 0.6rem;
      padding: 1px 7px;
      border-radius: 100px;
      margin-left: 6px;
      font-weight: 800;
      letter-spacing: 0.03em;
    }

    .compare-group-label {
      background: var(--iw-bg);
      border-top: 1px solid var(--iw-border);
      border-bottom: 1px solid var(--iw-border);
      padding: 10px 20px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--iw-ink-muted);
    }

    .compare-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      border-bottom: 1px solid var(--iw-border);
    }
    .compare-row:last-child { border-bottom: none; }

    .compare-row-alt {
      background: var(--iw-bg-alt);
    }

    .compare-feature-col {
      padding: 14px 20px;
      font-size: 0.88rem;
      font-weight: 400;
      color: var(--iw-ink);
      text-transform: none;
      letter-spacing: 0;
    }

    .compare-plan-col {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cell-check {
      font-size: 1rem;
      font-weight: 700;
      color: var(--iw-ink-muted);
    }
    .cell-check-amber { color: var(--iw-brand); }
    .cell-check-emerald { color: #2a8a6a; }

    .cell-x {
      color: var(--iw-border);
      font-size: 1.1rem;
    }

    .cell-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--iw-ink-muted);
      text-align: center;
    }
    .cell-text-amber { color: var(--iw-brand); }
    .cell-text-emerald { color: #2a8a6a; }

    /* ═══════════════════════════════════════════
       SOCIAL PROOF
    ═══════════════════════════════════════════ */
    .proof-strip {
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
      border-bottom: 1px solid var(--iw-border);
      padding: 56px 24px;
      text-align: center;
    }

    .proof-inner {
      display: flex;
      justify-content: center;
      gap: 64px;
      flex-wrap: wrap;
      max-width: 800px;
      margin: 0 auto 40px;
    }

    .proof-number {
      font-family: var(--font-display);
      font-size: 2.6rem;
      font-weight: 700;
      color: var(--iw-brand);
      line-height: 1;
    }

    .proof-label {
      font-size: 0.82rem;
      color: var(--iw-ink-muted);
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }

    .proof-logos {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .proof-logo-label {
      font-size: 0.78rem;
      color: var(--iw-ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .proof-logos-list {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .proof-brand {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--iw-ink);
      opacity: 0.45;
      transition: opacity 0.2s;
      letter-spacing: -0.01em;
    }
    .proof-brand:hover { opacity: 0.8; }

    /* ═══════════════════════════════════════════
       TESTIMONIALS
    ═══════════════════════════════════════════ */
    .testimonials-section {
      padding: 80px 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .testimonial-card {
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: 20px;
      padding: 36px 32px;
      position: relative;
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .testimonial-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.07);
    }

    .testimonial-quote {
      font-family: var(--font-display);
      font-size: 4rem;
      color: var(--iw-brand);
      opacity: 0.25;
      line-height: 1;
      margin-bottom: 8px;
      font-style: italic;
    }

    .testimonial-text {
      font-family: var(--font-prose);
      font-size: 0.95rem;
      line-height: 1.75;
      color: var(--iw-ink);
      margin: 0 0 24px;
      font-style: italic;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .testimonial-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--iw-brand-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .testimonial-info {
      flex: 1;
    }

    .testimonial-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--iw-ink);
    }

    .testimonial-role {
      font-size: 0.75rem;
      color: var(--iw-ink-muted);
    }

    .testimonial-plan {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 100px;
    }

    .plan-badge-Pro {
      background: var(--iw-brand-soft);
      color: var(--iw-brand);
      border: 1px solid var(--iw-brand-glow);
    }

    .plan-badge-Publication {
      background: rgba(42,138,106,0.1);
      color: #2a8a6a;
      border: 1px solid rgba(42,138,106,0.25);
    }

    /* ═══════════════════════════════════════════
       FAQ
    ═══════════════════════════════════════════ */
    .faq-section {
      padding: 80px 24px;
      background: var(--iw-bg-alt);
      border-top: 1px solid var(--iw-border);
    }

    .faq-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 80px;
      align-items: start;
    }

    .faq-left {
      position: sticky;
      top: 100px;
    }

    .faq-title {
      font-family: var(--font-display);
      font-size: 3rem;
      font-weight: 700;
      color: var(--iw-ink);
      line-height: 1.1;
      margin: 12px 0 16px;
    }
    .faq-title em {
      font-style: italic;
      color: var(--iw-brand);
    }

    .faq-subtitle {
      font-size: 0.9rem;
      color: var(--iw-ink-muted);
      margin: 0;
    }

    .faq-link {
      color: var(--iw-brand);
      text-decoration: none;
      font-weight: 600;
    }
    .faq-link:hover { text-decoration: underline; }

    .faq-decoration {
      font-family: var(--font-display);
      font-size: 10rem;
      font-weight: 900;
      color: var(--iw-brand);
      opacity: 0.06;
      line-height: 1;
      margin-top: 20px;
      user-select: none;
    }

    .faq-right {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .faq-item {
      border-bottom: 1px solid var(--iw-border);
      cursor: pointer;
    }
    .faq-item:first-child {
      border-top: 1px solid var(--iw-border);
    }

    .faq-question {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 4px;
      font-size: 0.98rem;
      font-weight: 600;
      color: var(--iw-ink);
      gap: 16px;
      transition: color 0.2s;
      user-select: none;
    }
    .faq-question:hover,
    .faq-question.faq-open {
      color: var(--iw-brand);
    }

    .faq-chevron {
      font-size: 1.4rem;
      color: var(--iw-ink-muted);
      flex-shrink: 0;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s;
    }
    .faq-chevron.rotated {
      transform: rotate(90deg);
      color: var(--iw-brand);
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease;
    }
    .faq-answer-open {
      max-height: 400px;
    }

    .faq-answer-inner {
      padding: 0 4px 22px;
      font-family: var(--font-prose);
      font-size: 0.92rem;
      color: var(--iw-ink-muted);
      line-height: 1.75;
    }

    /* ═══════════════════════════════════════════
       CTA BAND
    ═══════════════════════════════════════════ */
    .cta-band {
      position: relative;
      background: linear-gradient(135deg, #6b3510 0%, var(--iw-brand) 50%, #f0b870 100%);
      padding: 100px 24px;
      overflow: hidden;
    }

    .cta-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.06) 70%, transparent 80%);
      animation: rotateShin 12s linear infinite;
      pointer-events: none;
    }
    @keyframes rotateShin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .cta-band-inner {
      position: relative;
      z-index: 1;
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .cta-title {
      font-family: var(--font-display);
      font-size: clamp(30px, 4vw, 52px);
      font-weight: 700;
      color: #fff;
      line-height: 1.1;
      margin: 0 0 16px;
    }
    .cta-title em {
      font-style: italic;
      opacity: 0.85;
    }

    .cta-body {
      font-family: var(--font-prose);
      font-size: 1rem;
      color: rgba(255,255,255,0.8);
      line-height: 1.7;
      margin: 0;
    }

    .cta-right {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-cta-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      color: var(--iw-brand);
      padding: 18px 28px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 1.05rem;
      text-decoration: none;
      transition: transform 0.25s, box-shadow 0.25s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .btn-cta-main:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
    }

    .btn-arrow {
      font-size: 1.3rem;
      transition: transform 0.2s;
    }
    .btn-cta-main:hover .btn-arrow {
      transform: translateX(4px);
    }

    .btn-cta-ghost {
      display: block;
      text-align: center;
      border: 1.5px solid rgba(255,255,255,0.35);
      color: rgba(255,255,255,0.9);
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.25s;
      backdrop-filter: blur(8px);
    }
    .btn-cta-ghost:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.6);
    }

    .cta-disclaimer {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.55);
      text-align: center;
      margin: 4px 0 0;
    }

    /* ═══════════════════════════════════════════
       SHARED ANIMATION
    ═══════════════════════════════════════════ */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .plans-grid {
        grid-template-columns: 1fr;
        max-width: 480px;
        margin: 0 auto;
      }
      .plan-featured {
        margin-top: 0;
        order: -1;
      }
      .testimonials-grid {
        grid-template-columns: 1fr;
        max-width: 560px;
        margin: 0 auto;
      }
      .faq-inner {
        grid-template-columns: 1fr;
        gap: 40px;
      }
      .faq-left {
        position: static;
      }
      .faq-decoration { display: none; }
      .cta-band-inner {
        grid-template-columns: 1fr;
        gap: 40px;
        text-align: center;
      }
      .btn-cta-main { justify-content: center; }
    }

    @media (max-width: 768px) {
      .pricing-hero { padding: 120px 20px 80px; }
      .comparison-table { overflow-x: auto; }
      .comparison-header,
      .compare-row {
        min-width: 540px;
      }
      .proof-inner { gap: 32px; }
    }

    @media (max-width: 480px) {
      .trial-banner-inner { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class PricingPageComponent implements OnInit, OnDestroy {

  isYearly = signal(false);
  cardsVisible = signal(false);
  scrollProgress = signal(0);

  private scrollHandler = () => this.onScroll();

  // ── Free plan features (simple strings)
  freeFeatures: string[] = [
    'Unlimited articles published',
    'Basic analytics dashboard',
    'Public profile page',
    'Community reading access',
    'Standard editor',
    'Basic SEO tools',
  ];

  // ── Pro plan features (with highlight flag)
  proFeatures: { text: string; highlight?: boolean }[] = [
    { text: 'Everything in Free' },
    { text: 'Newsletter to all subscribers', highlight: true },
    { text: 'Advanced analytics & insights', highlight: true },
    { text: 'Monetization & paid subscriptions', highlight: true },
    { text: 'Custom publication domain' },
    { text: 'Priority email support' },
    { text: 'Remove InkWell branding' },
    { text: 'Early access to new features' },
    { text: 'Unlimited posts & drafts' },
  ];

  // ── Publication plan features
  publicationFeatures: { text: string; highlight?: boolean }[] = [
    { text: 'Everything in Pro' },
    { text: 'Up to 5 team members / authors', highlight: true },
    { text: 'Team newsletter management', highlight: true },
    { text: 'Revenue split for contributors', highlight: true },
    { text: 'Brand kit & custom themes', highlight: true },
    { text: 'Dedicated account manager' },
    { text: 'Custom contracts available' },
    { text: 'White-glove onboarding' },
    { text: 'API access for integrations' },
  ];

  // ── Comparison table — typed explicitly to allow mixed boolean | string per field
  comparisonGroups: ComparisonGroup[] = [
    {
      label: 'Publishing',
      rows: [
        { feature: 'Articles published',  free: 'Unlimited', pro: 'Unlimited', publication: 'Unlimited' },
        { feature: 'Rich text editor',    free: true,        pro: true,        publication: true },
        { feature: 'Draft & scheduling',  free: true,        pro: true,        publication: true },
        { feature: 'Cover images',        free: true,        pro: true,        publication: true },
        { feature: 'Custom URL slugs',    free: false,       pro: true,        publication: true },
      ],
    },
    {
      label: 'Newsletter',
      rows: [
        { feature: 'Newsletter delivery',           free: false,       pro: true,        publication: true },
        { feature: 'Newsletter subscribers',        free: false,       pro: 'Unlimited', publication: 'Unlimited' },
        { feature: 'Team newsletter management',    free: false,       pro: false,       publication: true },
        { feature: 'Custom sender domain',          free: false,       pro: true,        publication: true },
        { feature: 'Email open & click analytics',  free: false,       pro: true,        publication: true },
      ],
    },
    {
      label: 'Monetization',
      rows: [
        { feature: 'Paid subscriptions',        free: false, pro: true,  publication: true },
        { feature: 'Revenue dashboard',         free: false, pro: true,  publication: true },
        { feature: 'Contributor revenue split', free: false, pro: false, publication: true },
        { feature: 'InkWell platform fee',      free: '—',   pro: '8%',  publication: '5%' },
      ],
    },
    {
      label: 'Branding & Domain',
      rows: [
        { feature: 'Custom domain',           free: false, pro: true,  publication: true },
        { feature: 'Remove InkWell branding', free: false, pro: true,  publication: true },
        { feature: 'Brand kit & themes',      free: false, pro: false, publication: true },
      ],
    },
    {
      label: 'Analytics',
      rows: [
        { feature: 'Basic page analytics',      free: true,  pro: true, publication: true },
        { feature: 'Advanced reader insights',  free: false, pro: true, publication: true },
        { feature: 'Traffic source breakdown',  free: false, pro: true, publication: true },
        { feature: 'Export reports',            free: false, pro: true, publication: true },
      ],
    },
    {
      label: 'Support',
      rows: [
        { feature: 'Community support',         free: true,  pro: true,  publication: true },
        { feature: 'Email support',             free: false, pro: true,  publication: true },
        { feature: 'Priority queue',            free: false, pro: true,  publication: true },
        { feature: 'Dedicated account manager', free: false, pro: false, publication: true },
      ],
    },
  ];

  // ── Social proof
  proofStats: { number: string; label: string }[] = [
    { number: '1.2M+', label: 'Writers joined' },
    { number: '48M+',  label: 'Articles published' },
    { number: '4.8★',  label: 'Average rating' },
    { number: '99.9%', label: 'Uptime SLA' },
  ];

  trustedBrands: string[] = ['The Hindu', 'YourStory', 'Inc42', 'Entrackr', 'MediaNama', 'FactorDaily'];

  // ── Testimonials
  testimonials: { text: string; avatar: string; name: string; role: string; plan: string }[] = [
    {
      text: 'Switching to InkWell Pro transformed my newsletter. I went from 200 to 4,000 subscribers in three months. The analytics alone are worth every rupee.',
      avatar: '✍️',
      name: 'Arjun Sharma',
      role: 'Tech & Finance Writer',
      plan: 'Pro',
    },
    {
      text: "The ₹2 trial was a no-brainer. I expected a catch — there wasn't one. Full access, real analytics, and my first paid subscriber within a week.",
      avatar: '📖',
      name: 'Priya Mehta',
      role: 'Lifestyle & Culture Blogger',
      plan: 'Pro',
    },
    {
      text: 'We run a five-person editorial team on the Publication plan. The team newsletter tools and revenue splitting saved us hours of manual work each week.',
      avatar: '🏛️',
      name: 'Rishab Verma',
      role: 'Founder, The Dispatch',
      plan: 'Publication',
    },
  ];

  // ── FAQs
  faqs: FaqItem[] = [
    {
      question: 'What exactly is included in the ₹2 trial?',
      answer: "The ₹2 trial gives you complete Pro access for 15 days — newsletter delivery, advanced analytics, monetization tools, custom domain, and priority support. Nothing is hidden or watermarked. If you cancel before the 15 days are up, you won't be charged anything further.",
      open: false,
    },
    {
      question: 'Can free users send newsletters?',
      answer: 'No — newsletter delivery to subscribers is a Pro and Publication exclusive feature. Free users can publish articles publicly and build a readership on the platform, but the ability to send newsletters directly to subscriber email inboxes requires an active Pro or Publication plan.',
      open: false,
    },
    {
      question: 'How does the yearly billing discount work?',
      answer: "When you switch to yearly billing, you're charged annually at a discounted rate equivalent to 10 months instead of 12. For Pro, that's ₹5,988/year instead of ₹7,188. You save ₹1,200 — roughly two free months. The discount applies immediately on your next billing cycle.",
      open: false,
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major Indian payment methods — UPI (GPay, PhonePe, Paytm), debit & credit cards (Visa, Mastercard, RuPay), net banking, and wallets. International cards are also accepted for non-INR billing.',
      open: false,
    },
    {
      question: 'Can I switch from Pro to Publication later?',
      answer: "Absolutely. You can upgrade, downgrade, or switch plans at any time. When upgrading mid-cycle, you're charged the prorated difference. When downgrading, the difference is credited to your next billing cycle.",
      open: false,
    },
    {
      question: 'What happens to my content if I cancel?',
      answer: 'Your published articles remain live and accessible to readers. If you cancel Pro, features like newsletter sending and monetization are paused, but your content, analytics history, and subscriber list are preserved. You can reactivate at any time and pick up where you left off.',
      open: false,
    },
    {
      question: 'Is there a student or press discount?',
      answer: 'Yes — we offer a 40% discount for verified students and journalists. Email us at pricing@inkwell.in with your institution email or press credentials. Our team typically verifies within 24 hours.',
      open: false,
    },
  ];

  toggleBilling(): void {
    this.isYearly.update(v => !v);
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress.set(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
  }

  ngOnInit(): void {
    setTimeout(() => this.cardsVisible.set(true), 200);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
  }
}