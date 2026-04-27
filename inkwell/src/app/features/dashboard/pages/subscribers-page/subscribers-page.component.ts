import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { NewsletterApiService, Subscriber } from '../../../author/data-access/newsletter-api.service';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-subscribers-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscribers-page.component.html',
  styleUrl: './subscribers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscribersPageComponent implements OnInit {
  private readonly newsletterApi = inject(NewsletterApiService);
  private readonly authSession = inject(AuthSessionService);

  readonly subscribers = signal<Subscriber[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalSubscribers = computed(() => this.subscribers().length);
  readonly activeSubscribers = computed(() => 
    this.subscribers().filter(s => s.status === 'ACTIVE').length
  );
  readonly pendingSubscribers = computed(() => 
    this.subscribers().filter(s => s.status === 'PENDING').length
  );

  ngOnInit() {
    this.fetchSubscribers();
  }

  fetchSubscribers() {
    this.isLoading.set(true);
    this.error.set(null);

    this.newsletterApi.getSubscribers()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (subs) => this.subscribers.set(subs),
        error: (err) => {
          console.error('Error fetching subscribers:', err);
          this.error.set('Failed to load your subscriber list. Please try again later.');
        }
      });
  }

  getInitials(email: string): string {
    return email.substring(0, 2).toUpperCase();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
