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
}

export type UserRole = 'READER' | 'AUTHOR' | 'ADMIN';

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  bio?: string;
  avatarUrl?: string;
  provider?: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  isActive?: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authBaseCandidates = ['/auth'];

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
    // Backend doesn't have a dedicated resend endpoint yet, but register might re-send it
    // if the user is unverified, or we can just throw an error for now.
    return throwError(() => new Error('Resend OTP is not implemented on the backend yet.'));
  }

  verifyOtp(payload: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    // Backend expects query parameters for /verify: ?email=...&otp=...
    const url = `/verify?email=${encodeURIComponent(payload.email)}&otp=${encodeURIComponent(payload.otp)}`;
    return this.postWithFallback<VerifyOtpResponse>(url, {});
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

  private getWithFallback<T>(path: string): Observable<T> {
    return this.getAtIndex<T>(path, 0, []);
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
