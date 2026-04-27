import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService, AuthUser } from '../../../auth/data-access/auth-api.service';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly viewedUser = signal<AuthUser | null>(null);
  readonly isOwnProfile = computed(() => {
    const routeId = this.route.snapshot.paramMap.get('id');
    const currentUser = this.authSession.user();
    return !routeId || (currentUser && currentUser.userId.toString() === routeId);
  });

  readonly isLoading = signal(true);
  readonly isSavingProfile = signal(false);
  readonly isChangingPassword = signal(false);
  readonly isDeactivating = signal(false);
  readonly showDeactivateOtp = signal(false);
  readonly isConfirmingDeactivation = signal(false);

  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly dangerError = signal<string | null>(null);

  readonly user = computed(() => this.isOwnProfile() ? this.authSession.user() : this.viewedUser());
  readonly userName = computed(() => this.user()?.fullName ?? 'Writer');
  readonly userEmail = computed(() => this.user()?.email ?? '');
  readonly userRole = computed(() => this.user()?.role ?? 'READER');
  readonly userPlan = computed(() => this.user()?.plan ?? 'FREE');
  readonly avatarUrl = computed(() => this.user()?.avatarUrl ?? '');
  readonly userInitials = computed(() =>
    this.userName()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
  );
  readonly profileCompleteness = computed(() => {
    const user = this.user();

    if (!user) {
      return 0;
    }

    const checks = [
      !!user.fullName,
      !!user.bio,
      !!user.avatarUrl,
      !!user.contactNumber,
      !!user.socialLinks?.linkedin || !!user.socialLinks?.github || !!user.socialLinks?.twitter,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    bio: [''],
    contactNumber: [''],
    avatarUrl: [''],
    socialLinks: this.fb.nonNullable.group({
      linkedin: [''],
      instagram: [''],
      github: [''],
      twitter: [''],
    }),
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly deactivationOtpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
  });

  ngOnInit() {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId && !this.isOwnProfile()) {
      this.loadOtherProfile(routeId);
    } else {
      this.loadProfile();
    }
  }

  private loadOtherProfile(userId: string) {
    this.isLoading.set(true);
    this.authApi.getUserProfile(userId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (user) => {
          this.viewedUser.set(user);
        },
        error: (error) => {
          console.error('Failed to load user profile', error);
          this.router.navigate(['/feed']);
        }
      });
  }

  saveProfile() {
    this.profileMessage.set(null);
    this.profileError.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);

    this.authApi
      .updateProfile(this.profileForm.getRawValue())
      .pipe(finalize(() => this.isSavingProfile.set(false)))
      .subscribe({
        next: (user) => {
          this.authSession.saveUser(user);
          this.hydrateForms(user);
          this.profileMessage.set('Profile updated successfully.');
        },
        error: (error) => {
          this.profileError.set(
            error?.integrationHint ??
              (error instanceof Error ? error.message : null) ??
              error?.error?.message ??
              'Unable to update your profile right now.',
          );
        },
      });
  }

  changePassword() {
    this.passwordMessage.set(null);
    this.passwordError.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.passwordError.set('New password and confirmation must match.');
      return;
    }

    this.isChangingPassword.set(true);

    this.authApi
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => this.isChangingPassword.set(false)))
      .subscribe({
        next: (response) => {
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          this.passwordMessage.set(response.message ?? 'Password updated successfully.');
        },
        error: (error) => {
          this.passwordError.set(
            error?.integrationHint ??
              (error instanceof Error ? error.message : null) ??
              error?.error?.message ??
              'Unable to update your password right now.',
          );
        },
      });
  }

  deactivateAccount() {
    this.dangerError.set(null);

    const confirmed = confirm(
      'Are you absolutely sure you want to deactivate your account? This action is permanent and will delete all your data. A verification code will be sent to your email.',
    );

    if (!confirmed) {
      return;
    }

    this.isDeactivating.set(true);

    this.authApi
      .requestDeactivateAccount()
      .pipe(finalize(() => this.isDeactivating.set(false)))
      .subscribe({
        next: () => {
          this.showDeactivateOtp.set(true);
        },
        error: (error) => {
          this.dangerError.set(
            error?.integrationHint ??
              (error instanceof Error ? error.message : null) ??
              error?.error?.message ??
              'Failed to request account deactivation. Please try again.',
          );
        },
      });
  }

  confirmDeactivation() {
    this.dangerError.set(null);

    if (this.deactivationOtpForm.invalid) {
      this.deactivationOtpForm.markAllAsTouched();
      return;
    }

    this.isConfirmingDeactivation.set(true);
    const otp = this.deactivationOtpForm.getRawValue().otp;

    this.authApi
      .verifyDeactivateAccount(otp)
      .pipe(finalize(() => this.isConfirmingDeactivation.set(false)))
      .subscribe({
        next: () => {
          this.authSession.clearToken();
          void this.router.navigate(['/login']);
        },
        error: (error) => {
          this.dangerError.set(
            error?.integrationHint ??
              (error instanceof Error ? error.message : null) ??
              error?.error?.message ??
              'Incorrect OTP or verification failed. Please try again.',
          );
        },
      });
  }

  cancelDeactivation() {
    this.showDeactivateOtp.set(false);
    this.deactivationOtpForm.reset();
    this.dangerError.set(null);
  }

  private loadProfile() {
    this.isLoading.set(true);

    this.authApi
      .getProfile()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (user) => {
          this.authSession.saveUser(user);
          this.hydrateForms(user);
        },
        error: () => {
          const currentUser = this.authSession.getUser();

          if (currentUser) {
            this.hydrateForms(currentUser);
          }
        },
      });
  }

  private hydrateForms(user: AuthUser) {
    this.profileForm.reset({
      fullName: user.fullName ?? '',
      bio: user.bio ?? '',
      contactNumber: user.contactNumber ?? '',
      avatarUrl: user.avatarUrl ?? '',
      socialLinks: {
        linkedin: user.socialLinks?.linkedin ?? '',
        instagram: user.socialLinks?.instagram ?? '',
        github: user.socialLinks?.github ?? '',
        twitter: user.socialLinks?.twitter ?? '',
      },
    });
  }
}
