import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemorizationRecommendationCardComponent } from '../memorization-recommendation-card/memorization-recommendation-card.component';
import type {
  MemorizationRecommendation,
  MemorizationRecommendationCategoryGroup,
} from '../../types/memorization';

@Component({
  selector: 'app-memorization-recommendations-modal',
  standalone: true,
  imports: [CommonModule, MemorizationRecommendationCardComponent],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 p-2 sm:p-4 safe-area-overlay"
        style="padding-top: max(8px, env(safe-area-inset-top)); padding-bottom: max(8px, env(safe-area-inset-bottom));"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memorization-recommendations-title"
        (click)="onClose.emit()"
      >
        <div
          class="w-full max-w-lg max-h-[min(92vh,720px)] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
          (click)="$event.stopPropagation()"
        >
          <div
            class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
          >
            <h2
              id="memorization-recommendations-title"
              class="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Recommended verses
            </h2>
            <button
              type="button"
              (click)="onClose.emit()"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-3">
            @if (loading) {
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            } @else if (groupsWithVerses.length === 0) {
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No recommended verses yet. Check back later.
              </p>
            } @else {
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Tap a verse to add it to your memorization list.
              </p>
              @for (group of groupsWithVerses; track group.category.id) {
                <p
                  class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 mt-4 first:mt-0"
                >
                  {{ group.category.name }}
                </p>
                @for (rec of group.items; track rec.id) {
                  <app-memorization-recommendation-card
                    [recommendation]="rec"
                    [alreadyAdded]="isAlreadyAdded(rec)"
                    [busy]="busyId === rec.id"
                    (add)="add.emit($event)"
                  />
                }
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class MemorizationRecommendationsModalComponent {
  @Input() isOpen = false;
  @Input() groups: MemorizationRecommendationCategoryGroup[] = [];
  @Input() alreadyAddedReferences: ReadonlySet<string> = new Set();
  @Input() busyId: string | null = null;
  @Input() loading = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() add = new EventEmitter<MemorizationRecommendation>();

  get groupsWithVerses(): MemorizationRecommendationCategoryGroup[] {
    return this.groups.filter((g) => g.items.length > 0);
  }

  isAlreadyAdded(rec: MemorizationRecommendation): boolean {
    return this.alreadyAddedReferences.has(`${rec.translation}:${rec.reference}`);
  }
}
