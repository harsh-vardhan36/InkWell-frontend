import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-placeholder-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="placeholder">
      <div class="placeholder__hero">
        <p class="placeholder__eyebrow">In Progress</p>
        <h1>{{ title() }}</h1>
        <p>{{ description() }}</p>
      </div>

      <div class="placeholder__grid">
        <article class="placeholder__card">
          <h2>What is already prepared</h2>
          <ul>
            <li>Dashboard routing is now live for this section.</li>
            <li>The design matches the rest of the author workspace.</li>
            <li>This page is ready to be replaced with the final API-backed feature.</li>
          </ul>
        </article>

        <article class="placeholder__card">
          <h2>Suggested next implementation</h2>
          <p>{{ nextStep() }}</p>
          <a routerLink="/write" class="placeholder__cta">Open editor</a>
        </article>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .placeholder { padding: 28px; display: grid; gap: 20px; }
    .placeholder__hero,
    .placeholder__card {
      border-radius: 24px;
      border: 1px solid var(--iw-border);
      background: color-mix(in srgb, var(--iw-bg-alt) 94%, white 6%);
      box-shadow: var(--iw-shadow-lg, 0 14px 32px rgba(0, 0, 0, 0.06));
    }
    .placeholder__hero {
      padding: 30px;
      background:
        radial-gradient(circle at top right, rgba(201, 137, 58, 0.18), transparent 34%),
        color-mix(in srgb, var(--iw-bg-alt) 94%, white 6%);
    }
    .placeholder__eyebrow {
      margin: 0 0 10px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--iw-brand);
    }
    .placeholder__hero h1,
    .placeholder__card h2 {
      margin: 0;
      font-family: var(--font-display);
      letter-spacing: -0.04em;
      color: var(--iw-ink);
    }
    .placeholder__hero h1 { font-size: clamp(2rem, 4vw, 3rem); }
    .placeholder__hero p,
    .placeholder__card p,
    .placeholder__card li {
      color: var(--iw-muted);
      line-height: 1.7;
    }
    .placeholder__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .placeholder__card { padding: 24px; }
    .placeholder__card ul { margin: 16px 0 0; padding-left: 18px; }
    .placeholder__cta {
      display: inline-flex;
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 999px;
      background: linear-gradient(135deg, #9a5f1a, var(--iw-brand));
      color: #fff;
      text-decoration: none;
      font-weight: 800;
      box-shadow: 0 14px 30px var(--iw-brand-glow);
    }
    @media (max-width: 860px) {
      .placeholder { padding: 20px; }
      .placeholder__grid { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = computed(() => this.route.snapshot.data['title'] ?? 'Coming soon');
  readonly description = computed(
    () =>
      this.route.snapshot.data['description'] ??
      'This dashboard area is now routed and styled, and the final feature implementation can be added next.',
  );
  readonly nextStep = computed(
    () =>
      this.route.snapshot.data['nextStep'] ??
      'Wire this page to its dedicated backend endpoints and replace the placeholder cards with real data.',
  );
}
