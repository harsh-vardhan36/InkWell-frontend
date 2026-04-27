import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './analytics-page.component.html',
  styleUrl: './analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPageComponent implements OnInit {
  private readonly postApi = inject(PostApiService);
  private readonly authSession = inject(AuthSessionService);

  readonly isLoading = this.postApi.isLoading;
  readonly isFreePlan = computed(() => {
    const plan = this.authSession.user()?.plan;
    return !plan || plan.toUpperCase() !== 'PRO';
  });
  
  readonly stats = computed(() => {
    const posts = this.postApi.authorPosts();
    const published = posts.filter(p => p.status === 'PUBLISHED');
    const views = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
    const likes = posts.reduce((acc, p) => acc + (p.likeCount || 0), 0);
    const totalReadTime = posts.reduce((acc, p) => acc + (p.readTime || 0), 0);
    
    return {
      totalViews: views,
      totalLikes: likes,
      avgReadTime: posts.length > 0 ? Math.round(totalReadTime / posts.length) : 0,
      publishedCount: published.length
    };
  });

  ngOnInit() {
    // Shared state is updated in DashboardShell
  }
}
