import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostApiService } from '../../../author/data-access/post-api.service';
import { AuthSessionService } from '../../../auth/data-access/auth-session.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-my-posts-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-posts-page.component.html',
  styleUrl: './my-posts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPostsPageComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly postApi = inject(PostApiService);

  readonly posts = this.postApi.authorPosts;
  readonly isLoading = this.postApi.isLoading;
  readonly error = signal<string | null>(null);

  refresh() {
    this.postApi.refreshAuthorPosts();
  }

  constructor() {}

  ngOnInit() {}

  togglePublish(post: any) {
    const isPublished = post.status === 'PUBLISHED';
    const action = isPublished ? this.postApi.unpublishPost(post.id) : this.postApi.publishPost(post.id);
    
    action.subscribe({
      next: () => this.postApi.refreshAuthorPosts(),
      error: (err) => alert(err?.error?.message || 'Action failed')
    });
  }

  deletePost(id: number) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.postApi.deletePost(id).subscribe({
        next: () => this.postApi.refreshAuthorPosts(),
        error: (err) => alert(err?.error?.message || 'Delete failed')
      });
    }
  }



  getStatusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'badge--success';
      case 'DRAFT': return 'badge--warning';
      case 'ARCHIVED': return 'badge--danger';
      default: return 'badge--neutral';
    }
  }
}
