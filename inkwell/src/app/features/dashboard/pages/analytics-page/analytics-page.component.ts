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
    const s = this.postApi.authorStats();
    
    return {
      totalViews: s.totalViews || 0,
      totalLikes: s.totalLikes || 0,
      avgReadTime: 5, // Static for now or we can add it to backend stats
      publishedCount: s.publishedPosts || 0
    };
  });

  ngOnInit() {
    // Shared state is updated in DashboardShell
  }
}
