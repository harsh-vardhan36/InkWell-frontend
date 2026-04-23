import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeMode, ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-toggle" role="group" aria-label="Theme mode">
      <button
        *ngFor="let option of options"
        type="button"
        class="theme-toggle__button"
        [class.is-active]="theme.mode() === option.value"
        (click)="theme.setMode(option.value)"
      >
        <span>{{ option.icon }}</span>
        <span>{{ option.label }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      .theme-toggle {
        display: inline-flex;
        gap: 0.35rem;
        padding: 0.3rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--iw-surface-strong) 92%, transparent);
        border: 1px solid var(--iw-border);
        box-shadow: var(--iw-glass-shadow);
        backdrop-filter: blur(18px) saturate(150%);
      }

      .theme-toggle__button {
        border: 0;
        background: transparent;
        border-radius: 999px;
        padding: 0.55rem 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--iw-muted);
        cursor: pointer;
        transition:
          background-color 180ms ease,
          color 180ms ease,
          transform 180ms ease;
      }

      .theme-toggle__button:hover {
        color: var(--iw-ink);
      }

      .theme-toggle__button.is-active {
        background: linear-gradient(135deg, var(--iw-brand) 0%, #78a9ff 100%);
        color: white;
        transform: translateY(-1px);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      @media (max-width: 640px) {
        .theme-toggle {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly options: Array<{ label: string; value: ThemeMode; icon: string }> = [
    { label: 'Light', value: 'light', icon: 'Sun' },
    { label: 'Dark', value: 'dark', icon: 'Moon' },
    { label: 'Auto', value: 'system', icon: 'Sync' },
  ];
}
