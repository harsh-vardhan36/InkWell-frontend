import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthSessionService } from '../../auth/data-access/auth-session.service';

export interface MediaResponse {
  id: number;
  fileName: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  sizeKb: number;
  uploaderId: number;
  altText?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MediaApiService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly mediaBase = '/api/media';

  upload(file: File): Observable<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const user = this.authSession.getUser();
    if (user?.userId) {
      formData.append('uploaderId', user.userId.toString());
    }

    return this.http.post<MediaResponse>(`${this.mediaBase}/upload`, formData);
  }
}
