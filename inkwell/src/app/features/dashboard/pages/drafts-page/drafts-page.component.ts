import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostApiService } from '../../../author/data-access/post-api.service';

@Component({
  selector: 'app-drafts-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './drafts-page.component.html',
  styleUrl: './drafts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftsPageComponent {
  private readonly postApi = inject(PostApiService);

  readonly drafts = computed(() => 
    this.postApi.authorPosts().filter(p => p.status === 'DRAFT')
  );
  
  readonly isLoading = this.postApi.isLoading;

  deletePost(id: string) {
    if (confirm('Are you sure you want to delete this draft?')) {
      this.postApi.deletePost(id).subscribe(() => this.postApi.refreshAuthorPosts());
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Not saved';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}
