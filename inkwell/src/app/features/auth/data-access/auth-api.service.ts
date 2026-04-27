import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

export interface OtpResponse {
  message?: string;
  email?: string;
  otpSent?: boolean;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  jwtToken?: string;
  message?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  jwtToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type UserRole = 'READER' | 'AUTHOR' | 'ADMIN';

export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  github?: string;
  twitter?: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  plan: 'FREE' | 'PRO';
  planExpiry?: string;
  bio?: string;
  avatarUrl?: string;
  contactNumber?: string;
  socialLinks?: SocialLinks;
  provider?: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminUserStatusPayload {
  enabled: boolean;
  isActive?: boolean;
}

export interface AdminUserRolePayload {
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authBaseCandidates = ['/auth', '/api/auth'];

  login(payload: LoginRequest): Observable<AuthResponse> {
    const loginPayload = {
      email: payload.email,
      password: payload.password,
    };

    return this.postWithFallback<AuthResponse>('/login', loginPayload);
  }

  register(payload: RegisterRequest): Observable<OtpResponse> {
    return this.postWithFallback<OtpResponse>('/register', payload);
  }

  resendOtp(email: string): Observable<OtpResponse> {
    return this.postWithFallback<OtpResponse>('/resend-otp', { email });
  }

  verifyOtp(payload: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.postWithFallback<VerifyOtpResponse>('/verify', payload);
  }

  extractTokenFromOtp(response: VerifyOtpResponse | null | undefined): string | null {
    return (
      response?.token ??
      response?.accessToken ??
      response?.jwt ??
      response?.jwtToken ??
      null
    );
  }

  getProfile(): Observable<AuthUser> {
    return this.getWithFallback<AuthUser>('/profile');
  }

  getUserProfile(userId: number | string): Observable<AuthUser> {
    return this.getWithFallback<AuthUser>(`/${userId}`);
  }

  updateProfile(user: Partial<AuthUser>): Observable<AuthUser> {
    return this.putWithFallback<AuthUser>('/profile', user);
  }

  changePassword(payload: ChangePasswordRequest): Observable<{ message?: string }> {
    return this.putWithFallback<{ message?: string }>('/password', payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<OtpResponse> {
    return this.postWithFallback<OtpResponse>('/forgot-password', payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<{ message?: string }> {
    return this.postWithFallback<{ message?: string }>('/reset-password', {
      email: payload.email,
      otp: payload.otp,
      token: payload.otp,
      code: payload.otp,
      verificationCode: payload.otp,
      newPassword: payload.newPassword,
      password: payload.newPassword,
      confirmPassword: payload.newPassword,
    });
  }

  logout(): Observable<{ message?: string }> {
    return this.postWithFallback<{ message?: string }>('/logout', {});
  }

  becomeAuthor(email: string): Observable<OtpResponse> {
    return this.postWithFallback<OtpResponse>('/become-author/request', { email });
  }

  verifyAuthorOtp(payload: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.postWithFallback<VerifyOtpResponse>('/become-author/verify', payload);
  }

  refresh(): Observable<AuthResponse> {
    return this.postWithFallback<AuthResponse>('/refresh', {});
  }

  requestDeactivateAccount(): Observable<{ message?: string }> {
    return this.postWithFallback<{ message?: string }>('/deactivate/request', {});
  }

  verifyDeactivateAccount(otp: string): Observable<{ message?: string }> {
    const url = `/deactivate/verify?otp=${encodeURIComponent(otp)}`;
    return this.postWithFallback<{ message?: string }>(url, {});
  }

  getAdminUsers(): Observable<AuthUser[]> {
    return this.getWithFallback<AuthUser[]>('/admin/users');
  }

  updateAdminUserRole(
    userId: number | string,
    payload: AdminUserRolePayload,
  ): Observable<AuthUser> {
    return this.putWithFallback<AuthUser>(`/admin/users/${userId}/role`, {
      role: payload.role,
      newRole: payload.role,
    });
  }

  updateAdminUserStatus(
    userId: number | string,
    payload: AdminUserStatusPayload,
  ): Observable<AuthUser> {
    return this.putWithFallback<AuthUser>(`/admin/users/${userId}/status`, {
      enabled: payload.enabled,
      isActive: payload.enabled,
    });
  }

  getOauthUrl(provider: 'google' | 'github'): string {
    return `${environment.apiBaseUrl}/oauth2/authorization/${provider}`;
  }

  extractToken(response: AuthResponse | null | undefined): string | null {
    return (
      response?.token ??
      response?.accessToken ??
      response?.jwt ??
      response?.jwtToken ??
      null
    );
  }

  private postWithFallback<T>(path: string, body: unknown): Observable<T> {
    return this.postAtIndex<T>(path, body, 0, []);
  }

  private putWithFallback<T>(path: string, body: unknown): Observable<T> {
    return this.putAtIndex<T>(path, body, 0, []);
  }

  private getWithFallback<T>(path: string): Observable<T> {
    return this.getAtIndex<T>(path, 0, []);
  }

  private deleteWithFallback<T>(path: string): Observable<T> {
    return this.deleteAtIndex<T>(path, 0, []);
  }

  private postAtIndex<T>(
    path: string,
    body: unknown,
    index: number,
    attempts: string[],
  ): Observable<T> {
    const baseUrl = this.authBaseCandidates[index];
    const url = `${baseUrl}${path}`;

    return this.http.post<T>(url, body).pipe(
      catchError((error) => {
        const updatedAttempts = [...attempts, this.formatAttempt(url, error)];
        const shouldRetry = this.shouldRetryWithNextBase(error, index);

        if (shouldRetry) {
          return this.postAtIndex<T>(path, body, index + 1, updatedAttempts);
        }

        return throwError(() => this.decorateIntegrationError(error, path, updatedAttempts));
      }),
    );
  }

  private getAtIndex<T>(path: string, index: number, attempts: string[]): Observable<T> {
    const baseUrl = this.authBaseCandidates[index];
    const url = `${baseUrl}${path}`;

    return this.http.get<T>(url).pipe(
      catchError((error) => {
        const updatedAttempts = [...attempts, this.formatAttempt(url, error)];
        const shouldRetry = this.shouldRetryWithNextBase(error, index);

        if (shouldRetry) {
          return this.getAtIndex<T>(path, index + 1, updatedAttempts);
        }

        return throwError(() => this.decorateIntegrationError(error, path, updatedAttempts));
      }),
    );
  }

  private putAtIndex<T>(
    path: string,
    body: unknown,
    index: number,
    attempts: string[],
  ): Observable<T> {
    const baseUrl = this.authBaseCandidates[index];
    const url = `${baseUrl}${path}`;

    return this.http.put<T>(url, body).pipe(
      catchError((error) => {
        const updatedAttempts = [...attempts, this.formatAttempt(url, error)];
        const shouldRetry = this.shouldRetryWithNextBase(error, index);

        if (shouldRetry) {
          return this.putAtIndex<T>(path, body, index + 1, updatedAttempts);
        }

        return throwError(() => this.decorateIntegrationError(error, path, updatedAttempts));
      }),
    );
  }

  private deleteAtIndex<T>(path: string, index: number, attempts: string[]): Observable<T> {
    const baseUrl = this.authBaseCandidates[index];
    const url = `${baseUrl}${path}`;

    return this.http.delete<T>(url).pipe(
      catchError((error) => {
        const updatedAttempts = [...attempts, this.formatAttempt(url, error)];
        const shouldRetry = this.shouldRetryWithNextBase(error, index);

        if (shouldRetry) {
          return this.deleteAtIndex<T>(path, index + 1, updatedAttempts);
        }

        return throwError(() => this.decorateIntegrationError(error, path, updatedAttempts));
      }),
    );
  }

  private shouldRetryWithNextBase(error: unknown, currentIndex: number): boolean {
    const status = (error as { status?: number } | null)?.status;
    const hasNextCandidate = currentIndex < this.authBaseCandidates.length - 1;

    return hasNextCandidate && (status === 404 || status === 405);
  }

  private formatAttempt(url: string, error: unknown): string {
    const status = (error as { status?: number } | null)?.status ?? 'unknown';
    return `${url} (status: ${status})`;
  }

  private decorateIntegrationError(error: unknown, path: string, attempts: string[]) {
    const status = (error as { status?: number } | null)?.status;
    const isNetworkOrGatewayError = status === 0 || status === 404 || status === 502 || status === 503 || status === 504;

    if (isNetworkOrGatewayError) {
      const hint =
        `Auth integration failed for "${path}". Tried: ${attempts.join(', ')}. ` +
        'Verify gateway routes and auth controller mappings.';

      if (error && typeof error === 'object') {
        (error as { integrationHint?: string }).integrationHint = hint;
        return error;
      }

      return new Error(hint);
    }

    // It's likely an application error (e.g., 400, 401, or even a poorly mapped 500 from the backend)
    return error;
  }
}
