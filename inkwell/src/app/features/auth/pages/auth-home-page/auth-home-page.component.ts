import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../data-access/auth-session.service';

@Component({
  selector: 'app-auth-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auth-home-page.component.html',
  styleUrl: './auth-home-page.component.scss',
})
export class AuthHomePageComponent {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);

  readonly tokenPreview = computed(() => {
    const token = this.authSession.getToken();

    if (!token) {
      return null;
    }

    return `${token.slice(0, 24)}...`;
  });

  signOut() {
    this.authSession.clearToken();
    void this.router.navigateByUrl('/login');
  }
}
