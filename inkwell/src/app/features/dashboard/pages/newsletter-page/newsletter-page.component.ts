import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { NewsletterApiService, Subscriber } from '../../../author/data-access/newsletter-api.service';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { AuthApiService } from '../../../auth/data-access/auth-api.service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-newsletter-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-page.component.html',
  styleUrl: './newsletter-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterPageComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly newsletterApi = inject(NewsletterApiService);
  private readonly postApi = inject(PostApiService);
  private readonly toast = inject(ToastService);

  readonly subscribers = signal<Subscriber[]>([]);
  readonly publishedPosts = computed(() => 
    this.postApi.authorPosts().filter(p => p.status === 'PUBLISHED')
  );
  
  readonly subscribersCount = computed(() => this.subscribers().length);
  readonly activeCampaigns = signal(3); // Mock
  readonly openRate = signal(68); // Mock
  
  readonly isLoading = signal(true);
  readonly isSending = signal(false);
  readonly selectedPostId = signal<string>('');
  readonly customMessage = signal<string>('');
  readonly alertMessage = signal<{type: 'success' | 'error', text: string} | null>(null);

  // Mock campaign history
  readonly campaignHistory = signal<any[]>([
    { title: 'The Future of AI in Writing', sentAt: new Date(Date.now() - 86400000 * 2), subscribers: 2410, openRate: 72 },
    { title: 'InkWell v2.0 is Here!', sentAt: new Date(Date.now() - 86400000 * 5), subscribers: 2380, openRate: 65 },
    { title: 'Weekly Digest: Top Stories', sentAt: new Date(Date.now() - 86400000 * 12), subscribers: 2150, openRate: 58 },
  ]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    // Load subscribers (using real Followers from Auth service)
    this.authApi.getFollowers().subscribe({
      next: (users) => {
        const approvedUsers = users.filter(u => u.followStatus === 'APPROVED' || u.followStatus === 'ACCEPTED');
        const mapped: Subscriber[] = approvedUsers.map(u => ({
          id: u.userId,
          email: u.email || u.username,
          status: 'ACTIVE',
          createdAt: u.createdAt || new Date().toISOString()
        }));
        this.subscribers.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        console.error('Failed to load subscribers');
        this.isLoading.set(false);
      }
    });
  }

  selectPost(id: string) {
    this.selectedPostId.set(id);
  }

  sendAlert() {
    if (!this.selectedPostId()) {
      this.alertMessage.set({ type: 'error', text: 'Please select a post to share.' });
      return;
    }

    const post = this.publishedPosts().find(p => p.id.toString() === this.selectedPostId());
    if (!post) return;

    const link = `http://localhost:4200/blog/${post.id}`;
    
    this.isSending.set(true);
    this.alertMessage.set(null);
    
    // In a real app, we'd pass the customMessage to the backend
    this.newsletterApi.notifyNewPost(post.title, link)
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(`Campaign for "${post.title}" launched successfully!`);
          this.activeCampaigns.update(c => c + 1);
          
          // Add to history
          this.campaignHistory.update(h => [
            { title: post.title, sentAt: new Date(), subscribers: this.subscribersCount(), openRate: 0 },
            ...h
          ]);

          // Reset
          this.selectedPostId.set('');
          this.customMessage.set('');
        },
        error: () => {
          this.toast.error('Failed to launch campaign. Please try again later.');
        }
      });
  }
}
