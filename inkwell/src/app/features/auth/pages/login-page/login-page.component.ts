import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import {
  SocialLoginButtonsComponent,
} from '../../components/social-login-buttons/social-login-buttons.component';
import { AuthApiService } from '../../data-access/auth-api.service';
import { AuthSessionService } from '../../data-access/auth-session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SocialLoginButtonsComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);

  readonly showPassword = signal(false);
  readonly submitted = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly isAdminMode = computed(() => this.route.snapshot.data['mode'] === 'admin');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  togglePassword() {
    this.showPassword.update((value) => !value);
  }

  onSubmit() {
    this.submitted.set(true);
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authApi
      .login(this.form.getRawValue())
      .pipe(
        switchMap((response) => {
          const token = this.authApi.extractToken(response);

          if (!token) {
            throw new Error('Signed in, but no token was returned by the server.');
          }

          this.authSession.saveToken(token);

          return this.authApi.getProfile();
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.authSession.saveUser(user);
          void this.router.navigateByUrl(this.authSession.getPostLoginRedirectUrl());
        },
        error: (error) => {
          const message =
            error?.integrationHint ??
            (error instanceof Error ? error.message : null) ??
            (typeof error?.error === 'string' ? error.error : null) ??
            error?.error?.message ??
            error?.error?.error ??
            error?.error?.details ??
            (error?.status === 401
              ? 'Invalid email or password.'
              : 'Unable to sign in right now. Please try again.');

          this.submitError.set(message);
        },
      });
  }

}
