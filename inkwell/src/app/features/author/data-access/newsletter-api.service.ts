import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subscriber {
  id: number;
  email: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NewsletterApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/newsletter';

  getSubscribers(authorId?: number): Observable<Subscriber[]> {
    let params = new HttpParams();
    if (authorId) {
      params = params.set('authorId', authorId.toString());
    }
    return this.http.get<Subscriber[]>(`${this.baseUrl}/subscribers`, { params });
  }

  subscribe(email: string, authorId: number): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('authorId', authorId.toString());
    return this.http.post(`${this.baseUrl}/subscribe`, null, { params });
  }

  notifyNewPost(title: string, link: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/notify-new-post`, { title, link });
  }
}
