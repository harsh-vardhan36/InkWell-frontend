import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="editor-layout">
      <article class="editor-panel">
        <p class="editor-panel__eyebrow">Write</p>
        <input
          class="editor-panel__title"
          type="text"
          [(ngModel)]="title"
          placeholder="Give your story a title"
        />

        <div class="editor-toolbar">
          <button type="button" (click)="setMode('markdown')" [class.is-active]="mode() === 'markdown'">
            Markdown
          </button>
          <button type="button" (click)="setMode('rich')" [class.is-active]="mode() === 'rich'">
            Rich text
          </button>
          <button type="button">Insert code block</button>
          <button type="button" [disabled]="!isPro">Upload image</button>
        </div>

        <textarea
          class="editor-panel__body"
          [(ngModel)]="body"
          placeholder="Start with an idea worth reading..."
        ></textarea>

        <div class="editor-actions">
          <button type="button" class="ghost">Save draft</button>
          <button type="button" class="primary">Publish</button>
        </div>
      </article>

      <aside class="editor-side">
        <section class="editor-card">
          <p class="editor-panel__eyebrow">Publishing status</p>
          <div class="editor-row"><strong>Autosave</strong><span>Every 20 seconds</span></div>
          <div class="editor-row"><strong>Plan</strong><span>{{ isPro ? 'Pro' : 'Free' }}</span></div>
          <div class="editor-row"><strong>Media upload</strong><span>{{ isPro ? 'Enabled' : 'Upgrade required' }}</span></div>
        </section>

        <section class="editor-card">
          <p class="editor-panel__eyebrow">Preview notes</p>
          <p>
            Keep paragraphs short, add code blocks where needed, and use the day/night
            toggle to check long-form readability before you publish.
          </p>
        </section>
      </aside>
    </section>
  `,
  styles: [
    `
      .editor-layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 0.95fr);
        gap: 1rem;
      }

      .editor-panel,
      .editor-card {
        padding: 1.4rem;
        border-radius: 1.5rem;
        background: var(--iw-surface);
        border: 1px solid var(--iw-border);
        box-shadow: var(--iw-shadow);
      }

      .editor-panel__eyebrow {
        margin: 0 0 0.75rem;
        color: var(--iw-brand);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.78rem;
        font-weight: 700;
      }

      .editor-panel__title,
      .editor-panel__body {
        width: 100%;
        border: 1px solid var(--iw-border);
        border-radius: 1.1rem;
        background: var(--iw-surface-strong);
        color: var(--iw-ink);
      }

      .editor-panel__title {
        margin-bottom: 1rem;
        padding: 1rem 1.1rem;
        font-size: clamp(1.5rem, 2.5vw, 2.6rem);
        font-family: 'Baskerville', 'Iowan Old Style', 'Palatino Linotype', serif;
      }

      .editor-toolbar,
      .editor-actions,
      .editor-row {
        display: flex;
        gap: 0.7rem;
        flex-wrap: wrap;
      }

      .editor-toolbar {
        margin-bottom: 1rem;
      }

      .editor-toolbar button,
      .editor-actions button {
        border: 1px solid var(--iw-border);
        border-radius: 999px;
        padding: 0.75rem 1rem;
        background: transparent;
        cursor: pointer;
      }

      .editor-toolbar button.is-active,
      .editor-actions .primary {
        background: var(--iw-brand-strong);
        color: var(--iw-surface);
      }

      .editor-actions .ghost {
        background: var(--iw-surface-strong);
      }

      .editor-panel__body {
        min-height: 420px;
        resize: vertical;
        padding: 1rem 1.1rem;
        line-height: 1.75;
      }

      .editor-actions {
        margin-top: 1rem;
      }

      .editor-side {
        display: grid;
        gap: 1rem;
        align-self: start;
      }

      .editor-row {
        justify-content: space-between;
        padding: 0.85rem 0;
        border-top: 1px solid var(--iw-border);
      }

      .editor-row:first-of-type {
        border-top: 0;
        padding-top: 0;
      }

      .editor-card p {
        color: var(--iw-muted);
        line-height: 1.7;
      }

      @media (max-width: 960px) {
        .editor-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostEditorPageComponent {
  protected title = 'Day and night modes that respect the reading experience';
  protected body = `A good writing surface should disappear while still giving authors confidence.

Start with a strong opening paragraph, use subheadings to pace the piece, and add code blocks only when they clarify the idea.

When the backend autosave and publish APIs are ready, this page can connect directly to draft and publish endpoints.`;
  protected readonly mode = signal<'markdown' | 'rich'>('markdown');
  protected readonly isPro = false;

  protected setMode(mode: 'markdown' | 'rich') {
    this.mode.set(mode);
  }
}
