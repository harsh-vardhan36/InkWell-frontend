import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../data-access/auth-api.service';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/;

function passwordsMatch(control: AbstractControl) {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);

  readonly step = signal<'request' | 'reset'>('request');
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly requestedEmail = signal('');

  readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: [
        '',
        [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  readonly passwordsDoNotMatch = computed(
    () =>
      this.resetForm.touched &&
      this.resetForm.hasError('passwordMismatch') &&
      this.resetForm.controls.confirmPassword.touched,
  );

  requestReset() {
    this.submitError.set(null);
    this.successMessage.set(null);

    const candidateEmail =
      this.step() === 'reset'
        ? this.resetForm.controls.email.value || this.requestForm.controls.email.value
        : this.requestForm.controls.email.value;

    if (!candidateEmail) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const email = candidateEmail;
    this.requestForm.patchValue({ email });
    this.isSubmitting.set(true);

    this.authApi
      .forgotPassword({ email })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.requestedEmail.set(email);
          this.step.set('reset');
          this.resetForm.patchValue({ email });
          this.successMessage.set(
            response.message ?? 'A reset OTP has been sent to your email address.',
          );
        },
        error: (error) => {
          this.submitError.set(
            error?.integrationHint ??
              (error instanceof Error ? error.message : null) ??
              error?.error?.message ??
              error?.error?.error ??
              'Unable to send a reset code right now.',
          );
        },
      });
  }

  resetPassword() {
    this.submitError.set(null);
    this.successMessage.set(null);

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { email, otp, newPassword } = this.resetForm.getRawValue();
    this.isSubmitting.set(true);

    this.authApi
      .resetPassword({ email, otp, newPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(
            response.message ?? 'Password reset complete. You can sign in with the new password.',
          );
          this.step.set('request');
          this.requestForm.reset({ email });
          this.resetForm.reset({ email, otp: '', newPassword: '', confirmPassword: '' });
        },
        error: (error) => {
          this.submitError.set(
            error?.integrationHint ??
              (error instanceof Error ? error.message : null) ??
              error?.error?.message ??
              error?.error?.error ??
              (error?.status === 400
                ? 'Invalid OTP or password details.'
                : 'Unable to reset your password right now.'),
          );
        },
      });
  }

  goToResetStep() {
    const email = this.requestForm.controls.email.value;
    this.step.set('reset');
    this.resetForm.patchValue({ email });
    this.requestedEmail.set(email);
    this.submitError.set(null);
    this.successMessage.set(null);
  }

  goBack() {
    this.step.set('request');
    this.submitError.set(null);
    this.successMessage.set(null);
  }

  togglePassword() {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((value) => !value);
  }
}
