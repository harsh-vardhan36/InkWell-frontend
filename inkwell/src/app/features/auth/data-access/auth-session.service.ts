import { computed, Injectable, signal } from '@angular/core';
import { AuthUser, UserRole } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenKey = 'inkwell_token';
  private readonly userKey = 'inkwell_user';
  private readonly tokenState = signal<string | null>(this.readToken());
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly role = computed<UserRole | null>(() => this.userState()?.role ?? null);
  readonly plan = computed<'FREE' | 'PRO'>(() => this.userState()?.plan ?? 'FREE');
  readonly isPro = computed(() => this.plan() === 'PRO');
  readonly isAuthenticated = computed(() => {
    const token = this.tokenState();

    return !!token && !this.isTokenExpired(token);
  });

  saveToken(token: string) {
    this.tokenState.set(token);
    this.writeToken(token);
  }

  saveUser(user: AuthUser) {
    this.userState.set(user);
    this.writeUser(user);
  }

  saveSession(token: string, user: AuthUser) {
    this.saveToken(token);
    this.saveUser(user);
  }

  /** Call after a successful payment verification to refresh the plan in-session */
  updatePlan(plan: 'FREE' | 'PRO', planExpiry?: string) {
    const current = this.userState();
    if (!current) return;
    const updated: AuthUser = { ...current, plan, planExpiry };
    this.saveUser(updated);
  }

  clearToken() {
    this.tokenState.set(null);
    this.writeToken(null);
    this.userState.set(null);
    this.writeUser(null);
  }

  getToken(): string | null {
    return this.tokenState();
  }

  getUser(): AuthUser | null {
    return this.userState();
  }

  getPostLoginRedirectUrl(): string {
    switch (this.role()) {
      case 'ADMIN':
        return '/admin-server';
      case 'AUTHOR':
        return '/dashboard';
      case 'READER':
      default:
        return '/';
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const [, payloadSegment] = token.split('.');

      if (!payloadSegment) {
        return true;
      }

      const payload = JSON.parse(this.decodeBase64Url(payloadSegment)) as { exp?: number };

      return typeof payload.exp === 'number' ? payload.exp * 1000 < Date.now() : false;
    } catch {
      return true;
    }
  }

  private readToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  private readUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const value = localStorage.getItem(this.userKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private writeToken(token: string | null) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (token) {
      localStorage.setItem(this.tokenKey, token);
      return;
    }

    localStorage.removeItem(this.tokenKey);
  }

  private writeUser(user: AuthUser | null) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(this.userKey);
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), '=');

    return atob(padded);
  }
}
