import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap, interval, takeWhile, tap } from 'rxjs';
import {
  SocialLoginButtonsComponent,
} from '../../components/social-login-buttons/social-login-buttons.component';
import { AuthApiService } from '../../data-access/auth-api.service';
import { AuthSessionService } from '../../data-access/auth-session.service';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/;

function passwordsMatch(control: AbstractControl) {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SocialLoginButtonsComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  /** OTP Flow state */
  readonly currentStep = signal<'form' | 'otp'>('form');
  readonly registeredEmail = signal<string>('');
  readonly otpDigits = signal<string[]>(['', '', '', '', '', '']);
  readonly isVerifying = signal(false);
  readonly otpError = signal<string | null>(null);
  readonly otpSuccess = signal<string | null>(null);
  readonly resendCooldown = signal(0);
  readonly isResending = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)],
      ],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  readonly passwordsDoNotMatch = computed(
    () =>
      this.form.touched &&
      this.form.hasError('passwordMismatch') &&
      this.form.controls.confirmPassword.touched,
  );

  readonly maskedEmail = computed(() => {
    const email = this.registeredEmail();
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.length <= 3 ? local.charAt(0) : local.substring(0, 3);
    return `${visible}${'•'.repeat(Math.max(local.length - visible.length, 2))}@${domain}`;
  });

  readonly isOtpComplete = computed(() => {
    return this.otpDigits().every(d => d.length === 1 && /\d/.test(d));
  });

  readonly otpValue = computed(() => this.otpDigits().join(''));

  togglePassword() {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((value) => !value);
  }

  onSubmit() {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, fullName, email, password } = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.authApi
      .register({ username, fullName, email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.registeredEmail.set(email);
          this.currentStep.set('otp');
          this.startCooldown();
        },
        error: (error) => {
          const message =
            error?.integrationHint ??
            (error instanceof Error ? error.message : null) ??
            (typeof error?.error === 'string' ? error.error : null) ??
            error?.error?.message ??
            error?.error?.error ??
            error?.error?.details ??
            (error?.status === 409
              ? 'Email already registered.'
              : 'Unable to create your account right now. Please try again.');

          this.submitError.set(message);
        },
      });
  }

  onOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    
    // Update the signal
    const digits = [...this.otpDigits()];
    digits[index] = digit;
    this.otpDigits.set(digits);
    
    // Explicitly set the value to just the one digit to prevent browser "help"
    input.value = digit;
    this.otpError.set(null);

    // Auto-focus next input using a more stable selector
    if (digit && index < 5) {
      const container = input.closest('.otp-input-group');
      const allInputs = container?.querySelectorAll<HTMLInputElement>('input');
      if (allInputs && allInputs[index + 1]) {
        // Use a tiny timeout to ensure the current event is fully processed 
        // before shifting focus, preventing the digit from leaking into the next box.
        setTimeout(() => allInputs[index + 1].focus(), 0);
      }
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        const prevInput = input.parentElement?.querySelector<HTMLInputElement>(
          `input:nth-child(${index})`
        );
        if (prevInput) {
          prevInput.focus();
          prevInput.value = '';
          const digits = [...this.otpDigits()];
          digits[index - 1] = '';
          this.otpDigits.set(digits);
        }
      } else {
        const digits = [...this.otpDigits()];
        digits[index] = '';
        this.otpDigits.set(digits);
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = input.parentElement?.querySelector<HTMLInputElement>(
        `input:nth-child(${index})`
      );
      prevInput?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = input.parentElement?.querySelector<HTMLInputElement>(
        `input:nth-child(${index + 2})`
      );
      nextInput?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') ?? '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newOtpDigits = [...this.otpDigits()];
      digits.forEach((d, i) => {
        if (i < 6) newOtpDigits[i] = d;
      });
      this.otpDigits.set(newOtpDigits);

      // Update the actual input elements
      const container = (event.target as HTMLElement)?.parentElement;
      if (container) {
        const inputs = container.querySelectorAll<HTMLInputElement>('input');
        inputs.forEach((inp, i) => {
          inp.value = newOtpDigits[i] || '';
        });
        // Focus last filled or the next empty
        const focusIndex = Math.min(digits.length, 5);
        inputs[focusIndex]?.focus();
      }
    }
  }

  verifyOtp() {
    const code = this.otpValue();
    if (code.length !== 6) {
      this.otpError.set('Please enter the complete 6-digit code.');
      return;
    }

    this.isVerifying.set(true);
    this.otpError.set(null);
    this.otpSuccess.set(null);

    const email = this.registeredEmail();
    const password = this.form.getRawValue().password;

    this.authApi
      .verifyOtp({ email, otp: code })
      .pipe(
        switchMap(() => {
          // Verification successful, now login to get the JWT
          this.otpSuccess.set('Verified! Signing you in...');
          return this.authApi.login({ email, password, rememberMe: true });
        }),
        switchMap((loginResponse) => {
          const token = this.authApi.extractToken(loginResponse);
          if (!token) {
            throw new Error('Signed in, but no token was returned.');
          }
          this.authSession.saveToken(token);
          return this.authApi.getProfile();
        }),
        finalize(() => this.isVerifying.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.otpSuccess.set('Successfully created account! Redirecting...');
          this.authSession.saveUser(user);
          setTimeout(() => {
            void this.router.navigateByUrl(this.authSession.getPostLoginRedirectUrl());
          }, 800);
        },
        error: (error) => {
          const message =
            error?.integrationHint ??
            (error instanceof Error ? error.message : null) ??
            (typeof error?.error === 'string' ? error.error : null) ??
            error?.error?.message ??
            error?.error?.error ??
            (error?.status === 400
              ? 'Invalid or expired OTP. Please try again.'
              : error?.status === 410
                ? 'OTP has expired. Please request a new one.'
                : 'Verification failed. Please try again.');

          this.otpError.set(message);
        },
      });
  }

  resendOtp() {
    if (this.resendCooldown() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.otpError.set(null);

    this.authApi
      .resendOtp(this.registeredEmail())
      .pipe(finalize(() => this.isResending.set(false)))
      .subscribe({
        next: () => {
          this.otpSuccess.set('A new OTP has been sent to your email.');
          this.clearOtpInputs();
          this.startCooldown();
          setTimeout(() => this.otpSuccess.set(null), 4000);
        },
        error: (error) => {
          const message =
            error?.error?.message ??
            'Failed to resend OTP. Please try again.';
          this.otpError.set(message);
        },
      });
  }

  goBackToForm() {
    this.currentStep.set('form');
    this.otpError.set(null);
    this.otpSuccess.set(null);
    this.clearOtpInputs();
  }

  private clearOtpInputs() {
    this.otpDigits.set(['', '', '', '', '', '']);
  }

  private startCooldown() {
    this.resendCooldown.set(60);
    const timer = setInterval(() => {
      this.resendCooldown.update(v => v - 1);
      if (this.resendCooldown() <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }

}

