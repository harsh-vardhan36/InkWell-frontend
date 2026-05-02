import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import {
  SocialLoginButtonsComponent,
} from '../../components/social-login-buttons/social-login-buttons.component';
import { AuthApiService } from '../../data-access/auth-api.service';
import { AuthSessionService } from '../../data-access/auth-session.service';
import { ToastService } from '../../../../shared/services/toast.service';

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
  private readonly toast = inject(ToastService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly currentStep = signal<'form' | 'otp'>('form');
  readonly registeredEmail = signal<string>('');
  readonly otpDigits = signal<string[]>(['', '', '', '', '', '']);
  readonly isVerifying = signal(false);
  readonly otpError = signal<string | null>(null);
  readonly otpSuccess = signal<string | null>(null);
  readonly resendCooldown = signal(0);
  readonly isResending = signal(false);
  readonly showTermsModal = signal(false);
  readonly termsType = signal<'tos' | 'privacy'>('tos');


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

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirmPassword() { this.showConfirmPassword.update(v => !v); }

  openTerms(type: 'tos' | 'privacy', event?: Event) {
    event?.preventDefault();
    this.termsType.set(type);
    this.showTermsModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeTerms() {
    this.showTermsModal.set(false);
    document.body.style.overflow = '';
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
          this.toast.success('Verification code sent! Please check your email.');
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
          this.toast.error(message);
        },
      });
  }

  // ─── OTP INPUT HANDLERS (fixed) ──────────────────────────────────────────

  private getOtpInputs(el: HTMLElement): HTMLInputElement[] {
    const container = el.closest('.otp-input-group');
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLInputElement>('input'));
  }
  
  onOtpKeydown(index: number, event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const inputs = this.getOtpInputs(input);
    const key = event.key;
  
    // ── Navigation keys ──────────────────────────────────────────────────────
    if (key === 'ArrowLeft') {
      event.preventDefault();
      inputs[index - 1]?.focus();
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      inputs[index + 1]?.focus();
      return;
    }
    if (key === 'Tab') return; // let Tab work naturally
  
    // ── Backspace / Delete ───────────────────────────────────────────────────
    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      const digits = [...this.otpDigits()];
      if (digits[index]) {
        // Clear current box
        digits[index] = '';
        this.otpDigits.set(digits);
        input.value = '';
      } else if (index > 0) {
        // Already empty — go back and clear previous
        digits[index - 1] = '';
        this.otpDigits.set(digits);
        const prev = inputs[index - 1];
        prev.value = '';
        prev.focus();
      }
      this.otpError.set(null);
      return;
    }
  
    // ── Digit entry ──────────────────────────────────────────────────────────
    if (/^\d$/.test(key)) {
      event.preventDefault(); // stop browser writing the char itself
  
      const digits = [...this.otpDigits()];
      digits[index] = key;
      this.otpDigits.set(digits);
  
      // Write directly to DOM — don't rely on Angular re-render timing
      input.value = key;
      this.otpError.set(null);
  
      // Move focus — explicitly reset the next input's DOM value first
      if (index < 5) {
        const next = inputs[index + 1];
        next.value = digits[index + 1] ?? ''; // keep existing value, don't clear
        next.focus();
      }
      return;
    }
  
    // Block everything else (letters, symbols, etc.)
    event.preventDefault();
  }
  
  // onOtpInput is removed entirely — keydown handles everything on desktop.
  // For Android soft keyboards that skip keydown, we use a minimal input fallback:
  onOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const inputs = this.getOtpInputs(input);
  
    // Strip non-digits, keep only last character typed
    const digit = input.value.replace(/\D/g, '').slice(-1);
    input.value = digit; // immediately clamp to 1 digit in DOM
  
    const digits = [...this.otpDigits()];
    digits[index] = digit;
    this.otpDigits.set(digits);
    this.otpError.set(null);
  
    if (digit && index < 5) {
      inputs[index + 1]?.focus();
    }
  }
  
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') ?? '';
    const pasted = pastedData.replace(/\D/g, '').slice(0, 6);
    if (!pasted.length) return;
  
    const newDigits: string[] = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { newDigits[i] = d; });
    this.otpDigits.set(newDigits);
  
    // Sync all DOM inputs immediately
    const container = (event.target as HTMLElement).closest('.otp-input-group');
    if (container) {
      const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input'));
      inputs.forEach((inp, i) => { inp.value = newDigits[i]; });
      inputs[Math.min(pasted.length, 5)]?.focus();
    }
  }

  // ─── OTP VERIFY / RESEND ─────────────────────────────────────────────────

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
          this.otpSuccess.set('Verified! Signing you in...');
          this.toast.success('Account verified successfully!');
          return this.authApi.login({ email, password, rememberMe: true });
        }),
        switchMap((loginResponse) => {
          const token = this.authApi.extractToken(loginResponse);
          if (!token) throw new Error('Signed in, but no token was returned.');
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
          this.toast.error(message);
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
          this.otpError.set(error?.error?.message ?? 'Failed to resend OTP. Please try again.');
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
      if (this.resendCooldown() <= 0) clearInterval(timer);
    }, 1000);
  }
}