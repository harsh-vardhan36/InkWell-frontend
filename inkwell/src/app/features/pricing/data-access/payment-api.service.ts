import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateOrderRequest {
  plan: 'PRO_TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  currency?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  email: string;
  plan: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: string;
}

export interface VerifyPaymentResponse {
  message: string;
  plan: string;
  planExpiry: string;
}

export interface PlanStatusResponse {
  plan: 'FREE' | 'PRO';
  planExpiry: string;
}

/** Declares the Razorpay global injected by checkout.js in index.html */
declare const Razorpay: new (options: RazorpayOptions) => RazorpayInstance;

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  modal?: { backdropclose?: boolean; escape?: boolean };
  handler: (response: RazorpayPaymentResponse) => void;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: unknown) => void): void;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);

  /** Step 1 — Create a Razorpay order on the backend */
  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>('/auth/payment/create-order', request);
  }

  /** Step 3 — Verify payment signature and activate the plan */
  verifyPayment(request: VerifyPaymentRequest): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>('/auth/payment/verify', request);
  }

  /** Fetch current plan status */
  getPlanStatus(): Observable<PlanStatusResponse> {
    return this.http.get<PlanStatusResponse>('/auth/payment/status');
  }

  /** Dynamically loads the Razorpay checkout script if not present */
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject('Failed to load secure checkout. Please disable adblockers or check your connection.');
      document.body.appendChild(script);
    });
  }

  /**
   * Full Razorpay checkout flow:
   *   1. Creates backend order
   *   2. Opens Razorpay modal
   *   3. Verifies payment on success
   *   4. Resolves with VerifyPaymentResponse on success
   *   5. Rejects with error message on failure/dismissal
   */
  initiateCheckout(
    plan: 'PRO_TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY',
    description: string,
  ): Promise<VerifyPaymentResponse> {
    return new Promise((resolve, reject) => {
      this.createOrder({ plan }).subscribe({
        next: async (order) => {
          try {
            await this.loadRazorpayScript();
            
            const options: RazorpayOptions = {
              key: order.keyId,
              amount: order.amount,
              currency: order.currency,
              name: 'InkWell',
              description,
              order_id: order.orderId,
              prefill: { name: order.name, email: order.email },
              theme: { color: '#c9893a' },
              modal: { backdropclose: false, escape: false },
              handler: (paymentResponse: RazorpayPaymentResponse) => {
                this.verifyPayment({
                  razorpayOrderId:   paymentResponse.razorpay_order_id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature,
                  plan,
                }).subscribe({
                  next:  (res) => resolve(res),
                  error: (err) => reject(err?.error?.message ?? 'Verification failed'),
                });
              },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (response: unknown) => {
              const r = response as { error?: { description?: string } };
              reject(r?.error?.description ?? 'Payment failed');
            });
            rzp.open();
          } catch (error: any) {
            reject(error?.message ?? error ?? 'Failed to initialize payment gateway.');
          }
        },
        error: (err) =>
          reject(err?.error?.message ?? 'Could not initiate payment'),
      });
    });
  }
}
