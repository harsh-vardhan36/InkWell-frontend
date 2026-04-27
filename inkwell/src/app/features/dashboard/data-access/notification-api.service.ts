import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/notifications';

  getNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/user/${userId}/read-all`, {});
  }
}
