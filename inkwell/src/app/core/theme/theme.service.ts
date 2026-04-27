import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageKey = 'inkwell.theme.mode';
  private initialized = false;

  readonly mode = signal<ThemeMode>(this.readStoredMode());

  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const mode = this.mode();

    if (mode === 'system') {
      if (this.isBrowser && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }

    return mode;
  });

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        const theme = this.resolvedTheme();
        console.log('[ThemeService] Applying theme:', theme);
        this.applyTheme(theme);
      });
    }
  }

  init() {
    if (this.initialized || !this.isBrowser) return;
    this.initialized = true;

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.mode() === 'system') {
            this.applyTheme(this.resolvedTheme());
          }
        });
    }
  }

  setMode(mode: ThemeMode) {
    console.log('[ThemeService] Setting mode:', mode);
    this.mode.set(mode);
    this.persistMode(mode);
  }

  toggle() {
    this.setMode(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }

  private handleSystemThemeChange = () => {
    if (this.mode() === 'system') {
      this.applyTheme(this.resolvedTheme());
    }
  };

  private applyTheme(theme: 'light' | 'dark') {
    if (!this.isBrowser) return;

    const root = this.document.documentElement;
    if (root) {
      root.setAttribute('data-theme', theme);
      // Also update meta theme-color for mobile browsers
      const meta = this.document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#0c0e14' : '#faf7f2');
      }
    }
  }

  private readStoredMode(): ThemeMode {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      return 'system';
    }

    const value = localStorage.getItem(this.storageKey);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  }

  private persistMode(mode: ThemeMode) {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      return;
    }

    if (mode === 'system') {
      localStorage.removeItem(this.storageKey);
      return;
    }

    localStorage.setItem(this.storageKey, mode);
  }
}
