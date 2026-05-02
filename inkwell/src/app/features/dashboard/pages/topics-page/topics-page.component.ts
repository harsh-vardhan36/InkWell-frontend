import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryApiService, CategoryOption } from '../../../author/data-access/category-api.service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topics-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="topics-page">
      <header class="topics-header">
        <div class="topics-header__info">
          <h1>Topics & Taxonomy</h1>
          <p>Explore the categories and tags that organize InkWell's collective knowledge.</p>
        </div>
        <div class="topics-search">
          <input 
            type="text" 
            placeholder="Search topics..." 
            [(ngModel)]="searchQuery" 
            class="search-input"
          />
        </div>
      </header>

      <div class="topics-grid" *ngIf="!isLoading(); else loadingTemplate">
        <!-- Categories Section -->
        <section class="topics-section">
          <h2 class="section-title">Categories</h2>
          <div class="category-cards">
            <div 
              *ngFor="let cat of filteredCategories()" 
              class="cat-card"
              [routerLink]="['/feed']"
              [queryParams]="{ category: cat.name }"
            >
              <div class="cat-card__icon">📁</div>
              <h3 class="cat-card__name">{{ cat.name }}</h3>
              <p class="cat-card__stats">Discover stories in this category</p>
            </div>
          </div>
        </section>

        <!-- Tags Section -->
        <section class="topics-section">
          <h2 class="section-title">Trending Tags</h2>
          <div class="tags-cloud">
            <a 
              *ngFor="let tag of filteredTags()" 
              class="tag-pill"
              [routerLink]="['/feed']"
              [queryParams]="{ tag: tag }"
            >
              #{{ tag }}
            </a>
          </div>
        </section>
      </div>

      <ng-template #loadingTemplate>
        <div class="topics-loading">
          <div class="spinner"></div>
          <p>Loading taxonomy...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .topics-page { padding: 30px; animation: fadeIn 0.4s ease both; }
    
    .topics-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .topics-header h1 {
      font-family: var(--font-display);
      font-size: 2.5rem;
      margin: 0 0 8px;
      color: var(--iw-ink);
      letter-spacing: -0.04em;
    }

    .topics-header p { color: var(--iw-muted); margin: 0; }

    .search-input {
      padding: 12px 20px;
      border-radius: var(--r-pill);
      border: 1.5px solid var(--iw-border);
      background: var(--iw-surface);
      width: 280px;
      outline: none;
      transition: var(--trans);
    }

    .search-input:focus {
      border-color: var(--iw-brand);
      box-shadow: 0 0 0 4px var(--iw-brand-soft);
    }

    .topics-section { margin-bottom: 50px; }
    
    .section-title {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--iw-muted);
      margin-bottom: 24px;
      border-bottom: 1px solid var(--iw-border);
      padding-bottom: 12px;
    }

    .category-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }

    .cat-card {
      padding: 24px;
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-lg);
      cursor: pointer;
      transition: var(--trans);
    }

    .cat-card:hover {
      transform: translateY(-4px);
      border-color: var(--iw-brand);
      background: var(--iw-surface);
      box-shadow: var(--iw-shadow-lg);
    }

    .cat-card__icon { font-size: 2rem; margin-bottom: 16px; }
    .cat-card__name { margin: 0 0 8px; font-size: 1.25rem; color: var(--iw-ink); }
    .cat-card__stats { font-size: 0.85rem; color: var(--iw-muted); margin: 0; }

    .tags-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .tag-pill {
      padding: 8px 18px;
      background: var(--iw-bg-alt);
      border: 1px solid var(--iw-border);
      border-radius: var(--r-pill);
      font-size: 0.9rem;
      color: var(--iw-muted);
      text-decoration: none;
      transition: var(--trans);
    }

    .tag-pill:hover {
      background: var(--iw-brand-soft);
      color: var(--iw-brand);
      border-color: var(--iw-brand);
    }

    .topics-loading {
      padding: 100px;
      text-align: center;
      color: var(--iw-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--iw-border);
      border-top-color: var(--iw-brand);
      border-radius: 50%;
      margin: 0 auto 16px;
      animation: spin 0.8s linear infinite;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .topics-header { flex-direction: column; align-items: flex-start; }
      .search-input { width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsPageComponent implements OnInit {
  private readonly categoryApi = inject(CategoryApiService);

  readonly categories = signal<CategoryOption[]>([]);
  readonly tags = signal<string[]>([]);
  readonly isLoading = signal(true);
  readonly searchQuery = signal('');

  readonly filteredCategories = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.categories().filter(c => c.name.toLowerCase().includes(q));
  });

  readonly filteredTags = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.tags().filter(t => t.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.isLoading.set(true);
    this.categoryApi.getCategories().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(cats => {
      this.categories.set(cats);
      this.categoryApi.getTags().subscribe(tags => this.tags.set(tags));
    });
  }
}
