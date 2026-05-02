import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { AuthApiService } from '../../../auth/data-access/auth-api.service';
import { Subscriber } from '../../../author/data-access/newsletter-api.service';
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
  private readonly authApi = inject(AuthApiService);

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

    this.authApi.getFollowers()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (users) => {
          const mapped: Subscriber[] = users.map(u => ({
            id: u.userId,
            email: u.email || u.username,
            status: u.followStatus || 'PENDING',
            createdAt: u.createdAt || new Date().toISOString()
          }));
          this.subscribers.set(mapped);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching followers:', err);
          this.error.set('Failed to load your subscriber list. Please try again later.');
        }
      });
  }

  approveSubscriber(id: number) {
    this.authApi.approveFollow(id).subscribe({
      next: () => {
        this.subscribers.update(subs => 
          subs.map(s => s.id === id ? { ...s, status: 'ACTIVE' } : s)
        );
      },
      error: (err) => console.error('Failed to approve follower', err)
    });
  }

  rejectSubscriber(id: number) {
    this.authApi.rejectFollow(id).subscribe({
      next: () => {
        this.subscribers.update(subs => subs.filter(s => s.id !== id));
      },
      error: (err) => console.error('Failed to reject follower', err)
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
