import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageKey = 'inkwell.theme.mode';
  private readonly mediaQuery = this.getMediaQuery();

  private initialized = false;
  private readonly modeState = signal<ThemeMode>(this.readStoredMode());

  readonly mode = computed(() => this.modeState());
  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const mode = this.modeState();

    if (mode === 'system') {
      return this.mediaQuery?.matches ? 'dark' : 'light';
    }

    return mode;
  });

  init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    if (!this.isBrowser) {
      return;
    }

    this.applyTheme(this.resolvedTheme());

    this.mediaQuery?.addEventListener('change', this.handleSystemThemeChange);
  }

  setMode(mode: ThemeMode) {
    this.modeState.set(mode);
    this.persistMode(mode);
    this.applyTheme(this.resolvedTheme());
  }

  toggle() {
    this.setMode(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }

  private handleSystemThemeChange = () => {
    if (this.modeState() === 'system') {
      this.applyTheme(this.resolvedTheme());
    }
  };

  private applyTheme(theme: 'light' | 'dark') {
    if (!this.isBrowser) {
      return;
    }

    const root = this.document?.documentElement;

    if (!root) {
      return;
    }

    root.dataset['theme'] = theme;
  }

  private getMediaQuery(): MediaQueryList | null {
    if (!this.isBrowser || typeof window === 'undefined') {
      return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
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
