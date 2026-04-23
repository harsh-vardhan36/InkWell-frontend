import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service'; // ← adjust path if needed

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="profile-grid">
      <article class="profile-card profile-card--hero">
        <p class="profile-card__eyebrow">Profile</p>

        <!-- ✅ Dynamic — reads from AuthSessionService signal -->
        <h1>{{ userName() }}</h1>
        <p class="profile-card__meta">{{ userEmail() }}</p>

        <p class="profile-card__copy">
          Building thoughtful frontend experiences, writing about architecture, and
          turning projects into teachable stories.
        </p>
      </article>

      <article class="profile-card">
        <p class="profile-card__eyebrow">Account</p>
        <ul>
          <li>Plan: Free</li>
          <!-- ✅ Dynamic role -->
          <li>Role: {{ userRole() }}</li>
          <li>Theme preference: system-aware day/night mode</li>
          <li>Newsletter subscribers: 248</li>
        </ul>
      </article>

      <article class="profile-card">
        <p class="profile-card__eyebrow">Recent blogs</p>
        <div *ngFor="let post of posts" class="profile-row">
          <strong>{{ post.title }}</strong>
          <span>{{ post.metric }}</span>
        </div>
      </article>

      <article class="profile-card">
        <p class="profile-card__eyebrow">Profile goals</p>
        <div *ngFor="let goal of goals" class="profile-row">
          <strong>{{ goal.label }}</strong>
          <span>{{ goal.value }}</span>
        </div>
      </article>
    </section>
  `,
  styles: [`
    /* all your existing styles unchanged */
    .profile-card__meta {
      margin: 0.15rem 0 0.8rem;
      color: var(--iw-muted);
      font-size: 0.9rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly authSession = inject(AuthSessionService);

  // ✅ computed() keeps OnPush in sync automatically — no manual subscribe needed
  protected readonly userName  = computed(() => this.authSession.getUser()?.fullName  ?? 'User');
  protected readonly userEmail = computed(() => this.authSession.getUser()?.email     ?? '');
  protected readonly userRole  = computed(() => this.authSession.getUser()?.role      ?? '');

  protected readonly posts = [
    { title: 'Designing docs that become implementation plans', metric: '1.2k views' },
    { title: 'What a theme toggle needs to get right in Angular', metric: '312 likes' },
    { title: 'Creator dashboards that stay readable', metric: '18 comments' },
  ];

  protected readonly goals = [
    { label: 'Publish cadence', value: '2 posts per week' },
    { label: 'Focus category', value: 'Frontend architecture' },
    { label: 'Upgrade target', value: 'Pro for media uploads' },
  ];
}