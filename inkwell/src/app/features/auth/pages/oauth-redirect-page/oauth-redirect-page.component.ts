import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../data-access/auth-api.service';
import { AuthSessionService } from '../../data-access/auth-session.service';

@Component({
  selector: 'app-oauth-redirect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth-redirect-page.component.html',
  styleUrl: './oauth-redirect-page.component.scss',
})
export class OauthRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);

  readonly error = signal<string | null>(null);



  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.handleFailure('No token received from the OAuth provider.');
      return;
    }

    // ── ROBUST FALLBACK: STORAGE ──
    // Always write the token to localStorage. The parent window may be polling it.
    try {
      localStorage.setItem('INKWELL_OAUTH_TOKEN', token);
      // Optional: signal that it's a new token
      localStorage.setItem('INKWELL_OAUTH_TIME', Date.now().toString());
    } catch {
      // ignore
    }

    // ── SAME-WINDOW MODE ──
    this.continueAsSameWindow(token);
  }


  private continueAsSameWindow(token: string): void {
    this.authSession.saveToken(token);

    this.authApi.getProfile().subscribe({
      next: (user) => {
        this.authSession.saveUser(user);
        void this.router.navigateByUrl(this.authSession.getPostLoginRedirectUrl());
      },
      error: () => {
        // Profile fetch failed — still redirect
        void this.router.navigateByUrl(this.authSession.getPostLoginRedirectUrl());
      },
    });
  }

  private handleFailure(message: string): void {
    this.error.set(message);
    setTimeout(() => void this.router.navigate(['/login']), 2500);
  }
}