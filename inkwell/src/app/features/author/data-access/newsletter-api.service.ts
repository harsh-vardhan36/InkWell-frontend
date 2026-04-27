import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getSubscribers(): Observable<Subscriber[]> {
    return this.http.get<Subscriber[]>(`${this.baseUrl}/subscribers`);
  }

  notifyNewPost(title: string, link: string): Observable<void> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('link', link);
    return this.http.post<void>(`${this.baseUrl}/notify-new-post`, formData);
  }
}
