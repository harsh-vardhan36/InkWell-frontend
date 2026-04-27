import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface CategoryOption {
  id: number | string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<CategoryOption[]> {
    return this.http.get<unknown>('/categories').pipe(
      map((response) => this.normalizeCategories(response)),
    );
  }

  getTags(): Observable<string[]> {
    return this.http.get<unknown>('/categories/tags').pipe(
      map((response) => this.normalizeTags(response)),
    );
  }

  private normalizeCategories(response: unknown): CategoryOption[] {
    const list = Array.isArray(response)
      ? response
      : Array.isArray((response as { content?: unknown[] } | null)?.content)
        ? (response as { content: unknown[] }).content
        : Array.isArray((response as { data?: unknown[] } | null)?.data)
          ? (response as { data: unknown[] }).data
          : [];

    return list
      .map((item, index) => {
        const value = item as {
          id?: number | string;
          categoryId?: number | string;
          name?: string;
          title?: string;
          categoryName?: string;
        } | null;

        const id = value?.id ?? value?.categoryId ?? index;
        const name = value?.name ?? value?.title ?? value?.categoryName ?? '';

        return typeof name === 'string' && name.trim()
          ? { id, name: name.trim() }
          : null;
      })
      .filter((item): item is CategoryOption => item !== null);
  }

  private normalizeTags(response: unknown): string[] {
    const list = Array.isArray(response)
      ? response
      : Array.isArray((response as { content?: unknown[] } | null)?.content)
        ? (response as { content: unknown[] }).content
        : Array.isArray((response as { data?: unknown[] } | null)?.data)
          ? (response as { data: unknown[] }).data
          : [];

    return list
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        const value = item as { name?: string; tag?: string; label?: string } | null;
        return value?.name ?? value?.tag ?? value?.label ?? '';
      })
      .filter((tag) => !!tag);
  }
}
