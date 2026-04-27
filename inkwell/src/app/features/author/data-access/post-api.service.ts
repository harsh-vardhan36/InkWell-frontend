import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthSessionService } from '../../auth/data-access/auth-session.service';

export interface PostEditorPayload {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  categoryId?: number | string | null;
  coverImageUrl?: string;
  tags?: string[];
}

export interface NormalizedWriteResponse {
  body: unknown;
  location: string | null;
}

@Injectable({ providedIn: 'root' })
export class PostApiService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly postBaseCandidates = ['/api/posts', '/posts'];
  private readonly postBase = '/posts';

  readonly authorPosts = signal<any[]>([]);
  readonly isLoading = signal(false);

  refreshAuthorPosts(): void {
    const user = this.authSession.getUser();
    if (!user?.userId) return;

    this.isLoading.set(true);
    this.listAuthorPosts(user.userId).subscribe({
      next: (posts) => {
        this.authorPosts.set(posts);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  listPosts(): Observable<any[]> {
    return this.getWithFallback<any[]>('').pipe(
      map(posts => {
        if (!posts || posts.length === 0) {
          // If the first candidate returned empty, we don't necessarily want to fail,
          // but we might want to try the other one if we haven't already.
          return posts;
        }
        return posts;
      })
    );
  }

  listAuthorPosts(authorId: number | string): Observable<unknown[]> {
    return this.getWithFallback<unknown[]>(`/author/${authorId}`);
  }

  getPost(id: number | string): Observable<unknown> {
    return this.getWithFallback<unknown>(`/${id}`);
  }

  private getWithFallback<T>(path: string): Observable<T> {
    return this.getAtIndex<T>(path, 0, []);
  }

  private getAtIndex<T>(path: string, index: number, attempts: string[]): Observable<T> {
    const baseUrl = this.postBaseCandidates[index];
    const url = `${baseUrl}${path}`;

    return this.http.get<T>(url).pipe(
      map(res => {
        // If it's an array and empty, and we have more candidates, maybe we should try them?
        if (Array.isArray(res) && res.length === 0 && index < this.postBaseCandidates.length - 1) {
          throw new Error('Empty result, try next candidate');
        }
        return res;
      }),
      catchError((error: any) => {
        const updatedAttempts = [...attempts, `${url} (${error.status || 'empty'})` || 'error'];
        if (index < this.postBaseCandidates.length - 1) {
          return this.getAtIndex<T>(path, index + 1, updatedAttempts);
        }
        return throwError(() => error);
      })
    );
  }

  createPost(payload: PostEditorPayload): Observable<unknown> {
    return this.http
      .post<unknown>(this.postBase, this.buildWritePayload(payload), {
        observe: 'response',
      })
      .pipe(
        map((response) => this.normalizeWriteResponse(response)),
        map(res => {
          this.refreshAuthorPosts();
          return res;
        })
      );
  }

  updatePost(id: number | string, payload: PostEditorPayload): Observable<unknown> {
    return this.http
      .put<unknown>(`${this.postBase}/${id}`, this.buildWritePayload(payload), {
        observe: 'response',
      })
      .pipe(
        map((response) => this.normalizeWriteResponse(response)),
        map(res => {
          this.refreshAuthorPosts();
          return res;
        })
      );
  }

  publishPost(id: number | string): Observable<unknown> {
    return this.http.put<unknown>(`${this.postBase}/${id}/publish`, {});
  }

  unpublishPost(id: number | string): Observable<unknown> {
    return this.http.put<unknown>(`${this.postBase}/${id}/unpublish`, {});
  }

  deletePost(id: number | string): Observable<unknown> {
    return this.http.delete<unknown>(`${this.postBaseCandidates[0]}/${id}`).pipe(
      map(res => {
        this.refreshAuthorPosts();
        return res;
      })
    );
  }

  private buildWritePayload(payload: PostEditorPayload) {
    const tags = payload.tags ?? [];
    const coverImageUrl = payload.coverImageUrl ?? '';

    return {
      title: payload.title,
      content: payload.content,
      body: payload.content,
      excerpt: payload.excerpt,
      summary: payload.excerpt,
      description: payload.excerpt,
      slug: payload.slug,
      categoryId: payload.categoryId,
      category: payload.categoryId ? { id: payload.categoryId } : null,
      coverImageUrl,
      coverUrl: coverImageUrl,
      featuredImageUrl: coverImageUrl,
      tags,
      tagNames: tags,
      authorId: (this.authSession.user() as any)?.userId || 1,
      authorName: this.authSession.user()?.fullName || this.authSession.user()?.username || 'InkWell Author',
      status: 'PUBLISHED',
    };
  }

  private normalizeWriteResponse(response: HttpResponse<unknown>): NormalizedWriteResponse {
    return {
      body: response.body,
      location: response.headers.get('location'),
    };
  }
}
