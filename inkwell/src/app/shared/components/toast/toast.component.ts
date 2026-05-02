import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast"
        [class]="'toast--' + toast.type"
        role="alert"
        (click)="toastService.remove(toast.id)"
      >
        <div class="toast__icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
        </div>
        <div class="toast__message">{{ toast.message }}</div>
        <button class="toast__close" aria-label="Dismiss">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      min-width: 300px;
      max-width: 420px;
      padding: 14px 18px;
      background: var(--iw-surface-strong);
      backdrop-filter: blur(12px) saturate(1.8);
      -webkit-backdrop-filter: blur(12px) saturate(1.8);
      border: 1px solid var(--iw-border-2);
      border-radius: var(--r-md);
      box-shadow: var(--iw-shadow-lg);
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .toast:hover {
      transform: translateY(-2px);
      border-color: var(--iw-brand);
    }

    .toast__icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 800;
      flex-shrink: 0;
    }

    .toast--success .toast__icon { background: var(--iw-emerald-soft); color: var(--iw-emerald); }
    .toast--error .toast__icon   { background: rgba(220, 50, 50, 0.1); color: #c0392b; }
    .toast--info .toast__icon    { background: rgba(50, 120, 220, 0.1); color: #2980b9; }
    .toast--warning .toast__icon { background: rgba(240, 180, 50, 0.1); color: #d35400; }

    .toast__message {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--iw-ink);
      line-height: 1.4;
    }

    .toast__close {
      background: none;
      border: none;
      color: var(--iw-faint);
      font-size: 0.8rem;
      padding: 4px;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .toast:hover .toast__close { opacity: 1; }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @media (max-width: 480px) {
      .toast-container {
        top: auto;
        bottom: 24px;
        left: 16px;
        right: 16px;
      }
      .toast {
        min-width: 0;
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
