import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthApiService } from '../../data-access/auth-api.service';
import { AuthSessionService } from '../../data-access/auth-session.service';
import { catchError, of } from 'rxjs';

type Step = 'FEATURES' | 'TERMS' | 'OTP';

@Component({
  selector: 'app-become-author-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="author-gate">
      <div class="author-gate__card">
        <!-- ══ STEP 1: FEATURES ══ -->
        <ng-container *ngIf="currentStep() === 'FEATURES'">
          <p class="author-gate__eyebrow">Step 1 of 3</p>
          <h1>Empower your voice. Join our community of authors.</h1>
          
          <div class="quote-box">
            <p class="quote">"Writing is the only way to explain yourself to yourself."</p>
            <p class="quote-author">— Anonymous</p>
          </div>

          <div class="features-grid">
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <div class="feature-text">
                <h3>Rich Writing Tools</h3>
                <p>Powerful editor with markdown support and real-time previews.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <div class="feature-text">
                <h3>Deep Analytics</h3>
                <p>Track your audience growth, views, and engagement in real-time.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💰</span>
              <div class="feature-text">
                <h3>Monetize Content</h3>
                <p>Earn from your words through subscriptions and tips.</p>
              </div>
            </div>
          </div>

          <div class="author-gate__actions">
            <button (click)="goToStep('TERMS')" class="btn btn--primary">Next: Terms & Conditions</button>
          </div>
        </ng-container>

        <!-- ══ STEP 2: TERMS ══ -->
        <ng-container *ngIf="currentStep() === 'TERMS'">
          <p class="author-gate__eyebrow">Step 2 of 3</p>
          <h1>Author Guidelines</h1>
          <p class="terms-intro">To maintain a safe and quality environment, every author must agree to our community standards.</p>

          <div class="terms-container">
            <div class="term-point">
              <strong>🚫 No Abusive Content</strong>
              <p>Hate speech, bullying, or harassment of any kind is strictly prohibited.</p>
            </div>
            <div class="term-point">
              <strong>🚫 No False Information</strong>
              <p>Spreading misinformation or intentionally deceptive content will result in immediate suspension.</p>
            </div>
            <div class="term-point">
              <strong>🚫 Zero Tolerance for Harassment</strong>
              <p>Sexual harassment or any form of predatory behavior is grounds for permanent account deletion.</p>
            </div>
            <div class="term-warning">
              <span class="warning-icon">⚠️</span>
              <p>If found violating these terms, your account will be deleted without prior information and you will lose all access and data.</p>
            </div>
          </div>

          <div class="terms-check">
            <label class="checkbox-container">
              <input type="checkbox" [(ngModel)]="agreedToTerms">
              <span class="checkmark"></span>
              I agree to the Author Guidelines and Terms of Service.
            </label>
          </div>

          <div class="author-gate__actions">
            <button (click)="goToStep('FEATURES')" class="btn btn--soft">Back</button>
            <button (click)="goToStep('OTP')" [disabled]="!agreedToTerms" class="btn btn--primary">Next: Verify Email</button>
          </div>
        </ng-container>

        <!-- ══ STEP 3: OTP ══ -->
        <ng-container *ngIf="currentStep() === 'OTP'">
          <p class="author-gate__eyebrow">Step 3 of 3</p>
          <h1>Verification</h1>
          <p>We'll send a 4-digit OTP to your email to verify your author account.</p>

          <div class="verification-flow">
            <!-- Email Input -->
            <div class="form-group" *ngIf="!otpSent()">
              <label>Enter your email</label>
              <div class="input-wrap">
                <input type="email" [formControl]="emailControl" placeholder="name@example.com" class="input-field">
              </div>
              <button (click)="sendOtp()" [disabled]="emailControl.invalid || isLoading()" class="btn btn--primary btn--full">
                {{ isLoading() ? 'Sending...' : 'Send 4-digit OTP' }}
              </button>
            </div>

            <!-- OTP Input -->
            <div class="form-group" *ngIf="otpSent()">
              <div class="otp-sent-msg">
                <span>OTP sent to: <strong>{{ emailControl.value }}</strong></span>
                <button (click)="resetOtp()" class="btn-link">Change email</button>
              </div>
              <label>Enter 4-digit OTP</label>
              <div class="otp-inputs">
                <input #otp1 type="text" maxlength="1" class="otp-box" (keyup)="onOtpKeyUp($event, 1)">
                <input #otp2 type="text" maxlength="1" class="otp-box" (keyup)="onOtpKeyUp($event, 2)">
                <input #otp3 type="text" maxlength="1" class="otp-box" (keyup)="onOtpKeyUp($event, 3)">
                <input #otp4 type="text" maxlength="1" class="otp-box" (keyup)="onOtpKeyUp($event, 4)">
              </div>
              <p class="error-msg" *ngIf="errorMessage()">{{ errorMessage() }}</p>
              <button (click)="verifyOtp()" [disabled]="isLoading()" class="btn btn--primary btn--full">
                {{ isLoading() ? 'Verifying...' : 'Complete Verification' }}
              </button>
            </div>
          </div>

          <div class="author-gate__actions" *ngIf="!otpSent()">
            <button (click)="goToStep('TERMS')" class="btn btn--soft">Back</button>
          </div>
        </ng-container>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 120px); background: var(--iw-bg); }
    .author-gate { padding: 40px 20px; display: flex; justify-content: center; }
    .author-gate__card {
      max-width: 600px;
      width: 100%;
      padding: 40px;
      border-radius: 32px;
      border: 1px solid var(--iw-border);
      background: var(--iw-bg-alt);
      box-shadow: var(--iw-shadow-lg);
    }
    .author-gate__eyebrow {
      margin: 0 0 12px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--iw-brand);
    }
    h1 {
      margin: 0 0 24px;
      font-family: var(--font-display);
      font-size: 2rem;
      line-height: 1.2;
      color: var(--iw-ink);
    }
    
    /* Step 1 Styles */
    .quote-box {
      background: var(--iw-bg);
      border-left: 4px solid var(--iw-brand);
      padding: 20px;
      margin-bottom: 32px;
      border-radius: 0 16px 16px 0;
    }
    .quote { font-style: italic; color: var(--iw-ink); font-size: 1.1rem; margin-bottom: 8px; }
    .quote-author { font-size: 0.85rem; color: var(--iw-muted); font-weight: 600; }
    
    .features-grid { display: grid; gap: 20px; margin-bottom: 32px; }
    .feature-item { display: flex; gap: 16px; align-items: flex-start; }
    .feature-icon { font-size: 1.5rem; background: var(--iw-bg); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid var(--iw-border); }
    .feature-text h3 { font-size: 1rem; font-weight: 700; color: var(--iw-ink); margin: 0 0 4px; }
    .feature-text p { font-size: 0.9rem; color: var(--iw-muted); margin: 0; line-height: 1.5; }

    /* Step 2 Styles */
    .terms-intro { color: var(--iw-muted); margin-bottom: 24px; line-height: 1.6; }
    .terms-container { background: var(--iw-bg); border-radius: 20px; padding: 24px; border: 1px solid var(--iw-border); margin-bottom: 24px; }
    .term-point { margin-bottom: 16px; }
    .term-point strong { display: block; font-size: 0.9rem; color: var(--iw-ink); margin-bottom: 4px; }
    .term-point p { font-size: 0.85rem; color: var(--iw-muted); margin: 0; }
    .term-warning { display: flex; gap: 12px; padding: 12px; background: rgba(220,50,50,0.05); border-radius: 12px; border: 1px solid rgba(220,50,50,0.1); }
    .warning-icon { font-size: 1.2rem; }
    .term-warning p { font-size: 0.8rem; color: #dc3232; margin: 0; font-weight: 600; }
    
    .terms-check { margin-bottom: 32px; }
    .checkbox-container { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--iw-ink); cursor: pointer; }
    
    /* Step 3 Styles */
    .verification-flow { margin-top: 24px; }
    .form-group { display: flex; flex-direction: column; gap: 12px; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: var(--iw-ink); }
    .input-field { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid var(--iw-border); background: var(--iw-bg); color: var(--iw-ink); font-size: 1rem; outline: none; }
    .input-field:focus { border-color: var(--iw-brand); }
    
    .otp-sent-msg { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--iw-muted); margin-bottom: 8px; }
    .btn-link { background: none; border: none; color: var(--iw-brand); font-weight: 600; cursor: pointer; font-size: 0.85rem; }
    .otp-inputs { display: flex; gap: 12px; justify-content: center; margin: 12px 0 24px; }
    .otp-box { width: 60px; height: 64px; text-align: center; font-size: 1.8rem; font-weight: 700; border: 2px solid var(--iw-border); border-radius: 14px; background: var(--iw-bg); color: var(--iw-ink); }
    .otp-box:focus { border-color: var(--iw-brand); background: var(--iw-brand-soft); }
    .error-msg { color: #dc3232; font-size: 0.85rem; font-weight: 600; text-align: center; margin-bottom: 16px; }

    .author-gate__actions { display: flex; gap: 12px; margin-top: 12px; }
    .btn { padding: 14px 24px; border-radius: 14px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; }
    .btn--primary { background: var(--iw-brand); color: #fff; box-shadow: 0 8px 24px var(--iw-brand-glow); }
    .btn--primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px var(--iw-brand-glow); }
    .btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--soft { background: var(--iw-bg); border: 1px solid var(--iw-border); color: var(--iw-ink); }
    .btn--full { width: 100%; }

    @media (max-width: 480px) {
      .author-gate__card { padding: 24px; }
      .otp-box { width: 48px; height: 56px; font-size: 1.4rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BecomeAuthorPageComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private authSession = inject(AuthSessionService);
  private router = inject(Router);

  currentStep = signal<Step>('FEATURES');
  agreedToTerms = false;
  otpSent = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  emailControl = this.fb.control('', [Validators.required, Validators.email]);
  otpValues = ['', '', '', ''];

  goToStep(step: Step) {
    this.currentStep.set(step);
    this.errorMessage.set(null);
  }

  sendOtp() {
    if (this.emailControl.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authApi.becomeAuthor(this.emailControl.value!)
      .pipe(
        catchError(err => {
          this.errorMessage.set(err.error?.message || 'Failed to send OTP. Please try again.');
          return of(null);
        })
      )
      .subscribe(res => {
        this.isLoading.set(false);
        if (res) {
          this.otpSent.set(true);
        }
      });
  }

  resetOtp() {
    this.otpSent.set(false);
    this.errorMessage.set(null);
  }

  onOtpKeyUp(event: KeyboardEvent, index: number) {
    const val = (event.target as HTMLInputElement).value;
    
    if (event.key === 'Backspace' && !val && index > 1) {
      const prevInput = document.querySelector(`.otp-box:nth-child(${index - 1})`) as HTMLInputElement;
      prevInput?.focus();
    } else if (val && index < 4) {
      const nextInput = document.querySelector(`.otp-box:nth-child(${index + 1})`) as HTMLInputElement;
      nextInput?.focus();
    }
    
    this.otpValues[index - 1] = val;
  }

  verifyOtp() {
    const otp = this.otpValues.join('');
    if (otp.length < 4) {
      this.errorMessage.set('Please enter the 4-digit OTP.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authApi.verifyAuthorOtp({ email: this.emailControl.value!, otp })
      .pipe(
        catchError(err => {
          this.errorMessage.set(err.error?.message || 'Invalid OTP. Please try again.');
          return of(null);
        })
      )
      .subscribe(res => {
        this.isLoading.set(false);
        if (res) {
          // Update local session with new role (AUTHOR)
          const user = this.authSession.getUser();
          if (user) {
            this.authSession.saveUser({ ...user, role: 'AUTHOR' });
          }
          this.router.navigate(['/dashboard']);
        }
      });
  }
}
