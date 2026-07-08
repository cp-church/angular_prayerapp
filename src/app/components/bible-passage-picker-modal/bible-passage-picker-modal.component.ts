import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BIBLE_BOOKS_PUBLIC } from '../../lib/memorization/bibleCanonPublic';
import { buildBiblePassageReference } from '../../lib/memorization/buildBiblePassageReference';
import type { BibleBookPublic } from '../../lib/memorization/bible-structure-types';

type Testament = 'ot' | 'nt';

const TESTAMENT_KEY = 'prayer_app_memorize_add_testament';

@Component({
  selector: 'app-bible-passage-picker-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
    <div
      class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-gray-900/50 p-0 sm:p-4 safe-area-overlay"
      style="padding-top: max(8px, env(safe-area-inset-top)); padding-bottom: max(8px, env(safe-area-inset-bottom));"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bible-passage-picker-title"
      (click)="close.emit()"
    >
      <div
        class="w-full sm:max-w-lg max-h-[min(92vh,720px)] flex flex-col bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <div class="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 id="bible-passage-picker-title" class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {{ selectedChapterId ? 'Pick Verse Range' : 'Pick Chapter' }}
          </h2>
          <button
            type="button"
            (click)="close.emit()"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1 cursor-pointer"
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div class="shrink-0 px-4 sm:px-6 pt-3">
            <p class="mb-3 text-xs text-gray-600 dark:text-gray-400">
              Passages are loaded from the English Standard Version (ESV).
            </p>

            <div
              class="shrink-0 flex gap-2 mb-3"
              role="tablist"
              aria-label="Testament"
            >
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="testament === 'ot'"
                (click)="setTestament('ot')"
                class="flex-1 px-4 py-2.5 text-sm rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800"
                [class]="testament === 'ot'
                  ? 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'"
              >
                Old Testament
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="testament === 'nt'"
                (click)="setTestament('nt')"
                class="flex-1 px-4 py-2.5 text-sm rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800"
                [class]="testament === 'nt'
                  ? 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'"
              >
                New Testament
              </button>
            </div>
          </div>

          <div
            #bookListScroller
            class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-3"
          >
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              @for (book of filteredBooks; track book.id) {
              <div
                class="border-b border-gray-100 dark:border-gray-700 last:border-b-0 scroll-mt-3"
                [attr.data-book-id]="book.id"
              >
                <button
                  type="button"
                  (click)="toggleBook(book)"
                  class="w-full flex items-start justify-between gap-2 px-3 py-3 min-h-[48px] text-left text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer touch-manipulation"
                >
                  <span class="min-w-0 flex-1 leading-snug">{{ book.name }}</span>
                  <svg
                    class="w-5 h-5 shrink-0 text-gray-400 mt-0.5 transition-transform"
                    [class.rotate-180]="expandedBookId === book.id"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                @if (expandedBookId === book.id) {
                <div class="px-3 pb-3">
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400 pt-2 pb-1.5">Chapter</p>
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
                    @for (ch of sortedChapters(book); track ch.id) {
                    <button
                      type="button"
                      [attr.data-chapter-id]="ch.id"
                      (click)="onChapterClick(book, ch.id, +ch.number)"
                      class="w-full min-h-[44px] px-2 py-2 text-sm rounded-lg border cursor-pointer transition-colors inline-flex items-center justify-center touch-manipulation"
                      [class]="selectedChapterId === ch.id && selectedBookId === book.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
                    >
                      {{ ch.number }}
                    </button>
                    }
                  </div>

                  @if (selectedBookId === book.id && selectedChapterId) {
                  <div #verseSection class="mt-4 scroll-mt-3">
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-400 pb-1.5">Select verse(s)</p>
                    @if (verseNumbers.length > 0) {
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
                      @for (n of verseNumbers; track n) {
                      <button
                        type="button"
                        (click)="onVerseClick(n)"
                        class="w-full min-h-[44px] px-2 py-2 text-sm rounded-lg border cursor-pointer transition-colors inline-flex items-center justify-center touch-manipulation"
                        [class]="inRange(n)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
                      >
                        {{ n }}
                      </button>
                      }
                    </div>
                    }
                  </div>
                  }
                </div>
                }
              </div>
              }
            </div>
          </div>

          <div class="shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-900/40"
            style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom));"
          >
            <button
              type="button"
              [disabled]="!canConfirm"
              (click)="confirm()"
              class="w-full min-h-[48px] py-2.5 rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 disabled:hover:bg-blue-100 dark:disabled:hover:bg-blue-900/40 disabled:hover:border-blue-200 dark:disabled:hover:border-blue-700"
            >
              {{ busy ? 'Adding…' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class BiblePassagePickerModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() confirmLabel = 'Add';
  /** Parent sets true while saving (e.g. scripture fetch + DB insert). */
  @Input() busy = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<string>();

  @ViewChild('bookListScroller') private bookListScroller?: ElementRef<HTMLElement>;
  @ViewChild('verseSection') private verseSection?: ElementRef<HTMLElement>;

  testament: Testament = 'ot';
  expandedBookId: string | null = null;
  selectedChapterId: string | null = null;
  selectedChapterNum: number | null = null;
  selectedBookId: string | null = null;
  selectedBookName = '';
  verseCount: number | null = null;
  verseStart: number | null = null;
  verseEnd: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.testament = this.readTestament();
      this.resetSelection();
      this.expandedBookId = null;
    }
  }

  get filteredBooks(): BibleBookPublic[] {
    return BIBLE_BOOKS_PUBLIC.filter((b) => b.testament === this.testament);
  }

  get verseNumbers(): number[] {
    if (!this.verseCount || this.verseCount <= 0) return [];
    return Array.from({ length: this.verseCount }, (_, i) => i + 1);
  }

  get canConfirm(): boolean {
    return (
      this.selectedBookId !== null &&
      this.selectedChapterNum !== null &&
      !this.busy
    );
  }

  sortedChapters(book: BibleBookPublic) {
    return [...book.chapters].sort((a, b) => +a.number - +b.number);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isOpen) return;
    this.close.emit();
  }

  setTestament(next: Testament): void {
    this.testament = next;
    try {
      localStorage.setItem(TESTAMENT_KEY, next);
    } catch {
      /* ignore */
    }
    this.expandedBookId = null;
    this.selectedBookId = null;
    this.selectedBookName = '';
    this.resetSelection();
    requestAnimationFrame(() => this.resetBookListScroll());
  }

  toggleBook(book: BibleBookPublic): void {
    const wasExpanded = this.expandedBookId === book.id;
    if (wasExpanded) {
      this.expandedBookId = null;
      return;
    }
    this.expandedBookId = book.id;
    if (this.selectedBookId !== book.id) {
      this.resetSelection();
      this.selectedBookId = null;
      this.selectedBookName = '';
    }
    this.scheduleScrollBookRow(book.id);
  }

  onChapterClick(book: BibleBookPublic, chapterId: string, chapterNumber: number): void {
    const ch = book.chapters.find((c) => c.id === chapterId);
    this.selectedBookId = book.id;
    this.selectedBookName = book.name;
    this.selectedChapterId = chapterId;
    this.selectedChapterNum = chapterNumber;
    this.verseStart = null;
    this.verseEnd = null;
    this.verseCount = typeof ch?.verseCount === 'number' ? ch.verseCount : 0;
    this.scheduleScrollVerseSection();
  }

  onVerseClick(v: number): void {
    if (this.verseStart === null) {
      this.verseStart = v;
      this.verseEnd = null;
      return;
    }
    if (this.verseEnd === null) {
      if (v === this.verseStart) {
        this.verseStart = null;
        return;
      }
      const lo = Math.min(v, this.verseStart);
      const hi = Math.max(v, this.verseStart);
      this.verseStart = lo;
      this.verseEnd = hi;
      return;
    }
    this.verseStart = v;
    this.verseEnd = null;
  }

  inRange(n: number): boolean {
    if (this.verseStart === null) return false;
    if (this.verseEnd === null) return n === this.verseStart;
    const lo = Math.min(this.verseStart, this.verseEnd);
    const hi = Math.max(this.verseStart, this.verseEnd);
    return n >= lo && n <= hi;
  }

  confirm(): void {
    if (!this.canConfirm || this.selectedBookId === null || this.selectedChapterNum === null) return;
    const ref = buildBiblePassageReference(
      this.selectedBookId,
      this.selectedBookName,
      this.selectedChapterNum,
      this.verseStart,
      this.verseEnd
    );
    this.confirmed.emit(ref);
  }

  private resetSelection(): void {
    this.selectedChapterId = null;
    this.selectedChapterNum = null;
    this.verseCount = null;
    this.verseStart = null;
    this.verseEnd = null;
  }

  private resetBookListScroll(): void {
    const scroller = this.bookListScroller?.nativeElement;
    if (scroller) scroller.scrollTop = 0;
  }

  private scheduleScrollBookRow(bookId: string): void {
    requestAnimationFrame(() => {
      const scroller = this.bookListScroller?.nativeElement;
      if (!scroller) return;
      const row = scroller.querySelector<HTMLElement>(`[data-book-id="${bookId}"]`);
      if (!row) return;
      this.scrollElementIntoScroller(row);
    });
  }

  private scheduleScrollVerseSection(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = this.verseSection?.nativeElement;
        if (!el) return;
        this.scrollElementIntoScroller(el);
      });
    });
  }

  private scrollElementIntoScroller(element: HTMLElement): void {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({
      block: 'start',
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  }

  private readTestament(): Testament {
    try {
      const v = localStorage.getItem(TESTAMENT_KEY);
      if (v === 'ot' || v === 'nt') return v;
    } catch {
      /* ignore */
    }
    return 'ot';
  }
}
