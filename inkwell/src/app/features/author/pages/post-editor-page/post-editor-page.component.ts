import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { CategoryApiService, CategoryOption } from '../../data-access/category-api.service';
import {
  NormalizedWriteResponse,
  PostApiService,
  PostEditorPayload,
} from '../../data-access/post-api.service';

type EditorMode = 'markdown' | 'rich';

@Component({
  selector: 'app-post-editor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-editor-page.component.html',
  styleUrl: './post-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostEditorPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly postApi = inject(PostApiService);
  private readonly categoryApi = inject(CategoryApiService);

  readonly mode = signal<EditorMode>('markdown');
  readonly categories = signal<CategoryOption[]>([]);
  readonly suggestedTags = signal<string[]>([]);
  readonly draftId = signal<number | string | null>(null);
  readonly isLoading = signal(true);
  readonly isSavingDraft = signal(false);
  readonly isPublishing = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly previewTitle = computed(() => this.form.controls.title.value.trim() || 'Untitled story');
  readonly previewExcerpt = computed(
    () =>
      this.form.controls.excerpt.value.trim() ||
      'A short summary helps readers decide whether to open the full story.',
  );
  readonly previewCategory = computed(() => {
    const selected = this.categories().find(
      (category) => category.id.toString() === this.form.controls.categoryId.value,
    );

    return selected?.name ?? 'Uncategorized';
  });
  readonly previewTags = computed(() => this.parseTags(this.form.controls.tags.value).slice(0, 4));

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    excerpt: ['', [Validators.maxLength(220)]],
    slug: [''],
    categoryId: [''],
    tags: [''],
    coverImageUrl: [''],
    content: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly wordCount = computed(() => {
    const content = this.form.controls.content.value.trim();

    return content ? content.split(/\s+/).length : 0;
  });

  readonly readTime = computed(() => Math.max(1, Math.ceil(this.wordCount() / 220)));
  readonly deploymentNote =
    'Media upload will stay disabled in deployment until AWS S3 is configured for the media service.';

  ngOnInit() {
    const routeId = this.route.snapshot.paramMap.get('id');

    forkJoin({
      categories: this.categoryApi.getCategories(),
      tags: this.categoryApi.getTags(),
      post: routeId ? this.postApi.getPost(routeId) : of(null),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ categories, tags, post }) => {
          this.categories.set(categories);
          this.suggestedTags.set(tags.slice(0, 8));

          if (post) {
            this.hydrateFromPost(post);
          } else {
            this.seedDraft();
          }
        },
        error: () => {
          this.seedDraft();
          this.errorMessage.set('Editor loaded, but some post metadata could not be fetched yet.');
        },
      });
  }

  setMode(mode: EditorMode) {
    this.mode.set(mode);
  }

  insertSnippet(type: 'code' | 'quote' | 'image') {
    const control = this.form.controls.content;
    const current = control.value.trimEnd();

    const snippet =
      type === 'code'
        ? '\n\n```ts\n// Add a useful example here\n```\n'
        : type === 'quote'
          ? '\n\n> Add a pull-quote that deserves emphasis.\n'
          : '\n\n![Media placeholder](https://example.com/cover.jpg)\n';

    control.setValue(`${current}${snippet}`);
    control.markAsDirty();
  }

  applySuggestedTag(tag: string) {
    const currentTags = this.parseTags(this.form.controls.tags.value);

    if (currentTags.includes(tag)) {
      return;
    }

    this.form.controls.tags.setValue([...currentTags, tag].join(', '));
    this.form.controls.tags.markAsDirty();
  }

  saveDraft() {
    this.persistDraft('draft');
  }

  publish() {
    this.persistDraft('publish');
  }

  private persistDraft(mode: 'draft' | 'publish') {
    this.errorMessage.set(null);
    this.saveMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const activeId = this.route.snapshot.paramMap.get('id') ?? this.draftId();

    if (mode === 'draft') {
      this.isSavingDraft.set(true);
    } else {
      this.isPublishing.set(true);
    }

    const write$ = activeId
      ? this.postApi.updatePost(activeId, payload)
      : this.postApi.createPost(payload);

    write$
      .pipe(
        switchMap((response) => {
          const normalized = this.normalizePost(response);
          const resolvedId = normalized.id ?? activeId;

          if (resolvedId !== null && resolvedId !== undefined) {
            this.draftId.set(resolvedId);
          }

          if (mode === 'publish' && resolvedId !== null && resolvedId !== undefined) {
            return this.postApi.publishPost(resolvedId);
          }

          if (mode === 'publish') {
            throw new Error('Draft was created, but no post id was returned for publishing.');
          }

          return of(response);
        }),
        finalize(() => {
          this.isSavingDraft.set(false);
          this.isPublishing.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          const normalized = this.normalizePost(response);

          if (normalized.id !== null && normalized.id !== undefined) {
            this.draftId.set(normalized.id);
          }

          this.saveMessage.set(
            mode === 'publish'
              ? 'Post published successfully.'
              : 'Draft saved successfully.',
          );
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message ??
              (error instanceof Error ? error.message : null) ??
              `Unable to ${mode === 'publish' ? 'publish' : 'save'} this post right now.`,
          );
        },
      });
  }

  private buildPayload(): PostEditorPayload {
    const value = this.form.getRawValue();

    return {
      title: value.title.trim(),
      excerpt: value.excerpt.trim(),
      slug: value.slug.trim(),
      categoryId: value.categoryId || null,
      coverImageUrl: value.coverImageUrl.trim(),
      tags: this.parseTags(value.tags),
      content: value.content.trim(),
    };
  }

  private parseTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private seedDraft() {
    this.form.patchValue({
      title: '',
      excerpt: '',
      content:
        '',
    });
  }

  private hydrateFromPost(response: unknown) {
    const post = this.normalizePost(response);

    this.draftId.set(post.id ?? null);
    this.form.reset({
      title: post.title ?? '',
      excerpt: post.excerpt ?? '',
      slug: post.slug ?? '',
      categoryId: post.categoryId?.toString() ?? '',
      coverImageUrl: post.coverImageUrl ?? '',
      tags: post.tags.join(', '),
      content: post.content ?? '',
    });
  }

  private normalizePost(response: unknown) {
    const responseWithMeta = (response ?? {}) as NormalizedWriteResponse & {
      body?: unknown;
      location?: string | null;
    };
    const value = (
      'body' in responseWithMeta && responseWithMeta.body !== undefined
        ? responseWithMeta.body
        : responseWithMeta
    ) as {
      id?: number | string;
      postId?: number | string;
      title?: string;
      excerpt?: string;
      summary?: string;
      description?: string;
      slug?: string;
      content?: string;
      body?: string;
      categoryId?: number | string;
      category?: { id?: number | string } | null;
      coverImageUrl?: string;
      coverUrl?: string;
      thumbnailUrl?: string;
      featuredImageUrl?: string;
      tags?: Array<string | { name?: string; tag?: string }>;
    };
    const locationId = this.extractIdFromLocation(
      'location' in responseWithMeta ? responseWithMeta.location : null,
    );

    const tags = Array.isArray(value.tags)
      ? value.tags
          .map((tag) =>
            typeof tag === 'string' ? tag : tag?.name ?? tag?.tag ?? '',
          )
          .filter(Boolean)
      : [];

    return {
      id: value.id ?? value.postId ?? locationId ?? null,
      title: value.title ?? '',
      excerpt: value.excerpt ?? value.summary ?? value.description ?? '',
      slug: value.slug ?? '',
      content: value.content ?? value.body ?? '',
      categoryId: value.categoryId ?? value.category?.id ?? null,
      coverImageUrl:
        value.coverImageUrl ?? value.coverUrl ?? value.thumbnailUrl ?? value.featuredImageUrl ?? '',
      tags,
    };
  }

  private extractIdFromLocation(location: string | null | undefined) {
    if (!location) {
      return null;
    }

    const match = location.match(/\/posts\/([^/]+)$/);
    return match?.[1] ?? null;
  }
}
