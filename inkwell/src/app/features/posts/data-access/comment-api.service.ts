import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Comment {
  id?: number;
  postId: number | string;
  authorId?: number;
  authorName?: string;
  content: string;
  parentCommentId?: number | null;
  createdAt?: string;
  status?: string;
  likes?: number;
}

@Injectable({ providedIn: 'root' })
export class CommentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseCandidates = ['/comments', '/api/comments'];

  getCommentsByPost(postId: number | string): Observable<Comment[]> {
    return this.getWithFallback<Comment[]>(`/post/${postId}`);
  }

  getCommentCount(postId: number | string): Observable<number> {
    return this.getWithFallback<number>(`/post/${postId}/count`);
  }

  addComment(comment: Partial<Comment>): Observable<Comment> {
    return this.postWithFallback<Comment>('', comment);
  }

  getReplies(commentId: number): Observable<Comment[]> {
    return this.getWithFallback<Comment[]>(`/${commentId}/replies`);
  }

  likeComment(commentId: number): Observable<void> {
    return this.postWithFallback<void>(`/${commentId}/like`, {});
  }

  unlikeComment(commentId: number): Observable<void> {
    return this.postWithFallback<void>(`/${commentId}/unlike`, {});
  }

  private getWithFallback<T>(path: string): Observable<T> {
    return this.getAtIndex<T>(path, 0);
  }

  private postWithFallback<T>(path: string, body: any): Observable<T> {
    return this.postAtIndex<T>(path, body, 0);
  }

  private getAtIndex<T>(path: string, index: number): Observable<T> {
    const url = `${this.baseCandidates[index]}${path}`;
    return this.http.get<T>(url).pipe(
      catchError(err => {
        if (index < this.baseCandidates.length - 1 && (err.status === 404 || err.status === 0)) {
          return this.getAtIndex<T>(path, index + 1);
        }
        return throwError(() => err);
      })
    );
  }

  private postAtIndex<T>(path: string, body: any, index: number): Observable<T> {
    const url = `${this.baseCandidates[index]}${path}`;
    return this.http.post<T>(url, body).pipe(
      catchError(err => {
        if (index < this.baseCandidates.length - 1 && (err.status === 404 || err.status === 0)) {
          return this.postAtIndex<T>(path, body, index + 1);
        }
        return throwError(() => err);
      })
    );
  }
}
