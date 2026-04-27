import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeMode, ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <div class="theme-toggle" role="group" aria-label="Theme mode">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="theme-toggle__button"
          [class.is-active]="theme.mode() === option.value"
          (click)="setMode(option.value)"
          [title]="option.label + ' mode'"
        >
          <span class="theme-toggle__icon">{{ option.icon }}</span>
        </button>
      }
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
        width: 38px;
        height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--iw-muted);
        cursor: pointer;
        font-size: 1.1rem;
        transition:
          background-color 220ms cubic-bezier(0.4, 0, 0.2, 1),
          color 220ms cubic-bezier(0.4, 0, 0.2, 1),
          transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .theme-toggle__button:hover {
        color: var(--iw-ink);
      }

      .theme-toggle__button.is-active {
        background: var(--iw-brand-gradient);
        color: white;
        transform: translateY(-1px);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), var(--iw-brand-glow);
      }

    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly options: Array<{ label: string; value: ThemeMode; icon: string }> = [
    { label: 'Light', value: 'light', icon: '☀️' },
    { label: 'Dark', value: 'dark', icon: '🌙' },
    { label: 'Auto', value: 'system', icon: '🌗' },
  ];

  setMode(mode: ThemeMode) {
    console.log('[ThemeToggleComponent] Setting mode:', mode);
    this.theme.setMode(mode);
  }
}
