import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { AuthApiService } from '../../data-access/auth-api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-login-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-login-buttons.component.html',
  styleUrl: './social-login-buttons.component.scss',
})
export class SocialLoginButtonsComponent {
  private readonly authApi = inject(AuthApiService);
  @Output() oauthSelected = new EventEmitter<'google' | 'github'>();

  readonly loadingProvider = signal<'google' | 'github' | null>(null);

  onSelect(provider: 'google' | 'github') {
    if (this.loadingProvider() !== null) return; // prevent double-click

    this.loadingProvider.set(provider);
    this.oauthSelected.emit(provider);

    // ── SAME-WINDOW REDIRECT ──
    // Direct redirect to the Gateway to avoid cross-origin popup blocks (COOP).
    // Adding prompt=select_account to force account selection (supported by Google and GitHub).
    let oauthUrl = this.authApi.getOauthUrl(provider);
  if (provider === 'github') {
    oauthUrl += '?prompt=select_account'; // Add prompt only for GitHub
  }
  window.location.href = oauthUrl;
}
}