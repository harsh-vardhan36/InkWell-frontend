import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsState = signal<Toast[]>([]);
  readonly toasts = this.toastsState.asReadonly();
  private nextId = 0;

  show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = this.nextId++;
    const toast: Toast = { id, message, type, duration };
    this.toastsState.update((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  remove(id: number) {
    this.toastsState.update((prev) => prev.filter((t) => t.id !== id));
  }
}
