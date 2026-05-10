import { ApplicationRef, Component, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { PromptService } from '../../services/prompt.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import type { PrayerTypeRecord } from '../../types/prayer';

@Component({
  selector: 'app-prayer-types-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, ConfirmationDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40" [class.cursor-pointer]="!sectionExpanded" (click)="!sectionExpanded && onSectionToggle()">
      <button
        type="button"
        id="prayer-types-manager-trigger"
        class="admin-settings-collapsible-trigger cursor-pointer w-full flex min-h-12 items-center justify-between gap-2 text-left rounded-lg -mx-1 px-1 py-0.5 -my-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
        (click)="onSectionToggle(); $event.stopPropagation()"
        [attr.aria-expanded]="sectionExpanded"
        aria-controls="prayer-types-manager-panel"
      >
        <span class="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
          <svg class="text-blue-600 dark:text-blue-400 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          Prayer Types
        </span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200"
          [class.rotate-180]="sectionExpanded"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      @if (sectionExpanded) {
      <div
        id="prayer-types-manager-panel"
        role="region"
        aria-labelledby="prayer-types-manager-trigger"
        class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
      <div id="tour-prayer-types-toolbar" class="flex justify-end mb-4">
        <button
          type="button"
          (click)="toggleAddForm()"
          title="Add new prayer type"
          class="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Type
        </button>
      </div>

      <p id="tour-prayer-types-intro" class="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Manage the available types for prayer prompts. You can reorder, activate/deactivate, or delete types.
      </p>

      <!-- Error Message -->
      @if (error) {
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>
      }

      <!-- Success Message -->
      @if (success) {
      <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
        <p class="text-sm text-green-800 dark:text-green-200">{{ success }}</p>
      </div>
      }

      <!-- Add/Edit Form -->
      @if (showAddForm) {
      <form novalidate class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100">
            {{ editingId ? 'Edit Prayer Type' : 'Add New Prayer Type' }}
          </h4>
          <button
            type="button"
            (click)="cancelEdit()"
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="grid gap-3">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type Name *
            </label>
            <input
              type="text"
              id="name"
              [(ngModel)]="name"
              name="name"
              (keydown.enter)="onTypeNameEnter($event)"
              placeholder="e.g., Healing, Guidance, Thanksgiving"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="displayOrder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <input
                type="number"
                id="displayOrder"
                [(ngModel)]="displayOrder"
                name="displayOrder"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="isActive"
                  name="isActive"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Inactive types won't appear in dropdowns
              </p>
            </div>
          </div>
          <div>
            <label for="includeInBooklet" class="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="includeInBooklet"
                [(ngModel)]="includeInBooklet"
                name="includeInBooklet"
                class="w-4 h-4 mt-0.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500 dark:bg-gray-800 dark:border-gray-600"
              />
              <span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Include in saddle-stitch booklet
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  When enabled, prompts for this category appear after answered prayers in Admin → Tools → Saddle-stitch booklet (same setting as the book icon on each row).
                </span>
              </span>
            </label>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          @if (submitting) {
          <div
            class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300"
            role="status"
            aria-live="polite"
          >
            <span
              class="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent"
              aria-hidden="true"
            ></span>
            <span>Saving…</span>
          </div>
          }
          <div class="flex gap-2">
            <button
              type="button"
              (click)="saveType()"
              [disabled]="submitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm cursor-pointer"
            >
              {{ submitting ? 'Saving…' : (editingId ? 'Update Type' : 'Add Type') }}
            </button>
            <button
              type="button"
              (click)="cancelEdit()"
              [disabled]="submitting"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:pointer-events-none transition-colors text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
      }

      <div id="tour-prayer-types-list-area">
      <!-- Loading State -->
      @if (loading) {
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Loading types...</p>
      </div>
      }

      <!-- Empty State -->
      @if (!loading && types.length === 0) {
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg class="mx-auto mb-2 opacity-50" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <p>No prayer types found</p>
        <p class="text-sm mt-1">Add your first type to get started</p>
      </div>
      }

      <!-- Types List with Drag & Drop -->
      @if (!loading && types.length > 0) {
      <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="space-y-2">
        @for (type of types; track type.id) {
        <div
          cdkDrag
          [class]="'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border ' + 
            (type.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-gray-300 dark:border-gray-600 opacity-60')"
        >
          <div class="flex items-center gap-3 flex-1">
            <div class="flex flex-col gap-1">
              <button
                cdkDragHandle
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-move"
                title="Drag to reorder"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="5" r="1"></circle>
                  <circle cx="9" cy="12" r="1"></circle>
                  <circle cx="9" cy="19" r="1"></circle>
                  <circle cx="15" cy="5" r="1"></circle>
                  <circle cx="15" cy="12" r="1"></circle>
                  <circle cx="15" cy="19" r="1"></circle>
                </svg>
              </button>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ type.name }}</h4>
                @if (!type.is_active) {
                <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">Inactive</span>
                }
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-500">
                Order: {{ type.display_order }} • Created {{ formatDate(type.created_at) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="relative inline-flex shrink-0 group/booklet-tip">
              <button
                type="button"
                (pointerdown)="$event.stopPropagation()"
                (click)="beginIncludeInBookletToggle(type, $event)"
                [class]="
                  'p-2 rounded-lg transition-colors cursor-pointer ' +
                  (type.include_in_booklet
                    ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')
                "
                [title]="
                  type.include_in_booklet
                    ? 'Included in saddle-stitch booklet (click to exclude)'
                    : 'Include in saddle-stitch booklet'
                "
                [attr.aria-describedby]="'prayer-type-booklet-tip-' + type.id"
                [attr.aria-label]="
                  type.include_in_booklet
                    ? 'Included in saddle-stitch booklet. Click to exclude.'
                    : 'Not in booklet. Click to include.'
                "
                [attr.aria-pressed]="type.include_in_booklet"
              >
                @if (type.include_in_booklet) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path
                    d="M21 4.27V18.5c0 .83-.67 1.5-1.5 1.5h-4.25c-.28 0-.5.22-.5.5v1.25c0 .28-.22.5-.5.5H9.75c-.28 0-.5-.22-.5-.5V20.5c0-.28-.22-.5-.5-.5H4.5c-.83 0-1.5-.67-1.5-1.5V4.27c0-.97.78-1.75 1.75-1.75h3.5c.72 0 1.4.37 1.78.97l.47.73.47-.73c.39-.6 1.06-.97 1.78-.97h3.5c.97 0 1.75.78 1.75 1.75ZM8.25 6H5v11h3.25c.41 0 .75-.34.75-.75V6.75c0-.41-.34-.75-.75-.75Zm7.5 0h-3.25c-.41 0-.75.34-.75.75v9.5c0 .41.34.75.75.75H15.75c.41 0 .75-.34.75-.75V6.75c0-.41-.34-.75-.75-.75Z"
                  />
                </svg>
                }
                @if (!type.include_in_booklet) {
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M8 7h6" />
                  <path d="M8 11h8" />
                </svg>
                }
              </button>
              <span
                role="tooltip"
                [id]="'prayer-type-booklet-tip-' + type.id"
                class="pointer-events-none absolute z-[60] bottom-full left-1/2 mb-1.5 w-max max-w-[min(17rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-md border border-gray-200 bg-gray-900 px-2.5 py-1.5 text-center text-xs font-medium leading-snug text-white shadow-lg opacity-0 transition-opacity duration-150 invisible group-hover/booklet-tip:opacity-100 group-hover/booklet-tip:visible group-focus-within/booklet-tip:opacity-100 group-focus-within/booklet-tip:visible dark:border-gray-600 dark:bg-gray-700"
              >
                {{
                  type.include_in_booklet
                    ? 'Included in saddle-stitch booklet (click to exclude)'
                    : 'Include in saddle-stitch booklet'
                }}
              </span>
            </span>
            <button
              type="button"
              (pointerdown)="$event.stopPropagation()"
              (click)="beginActiveToggle(type, $event)"
              [class]="'p-2 rounded-lg transition-colors cursor-pointer ' + 
                (type.is_active ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')"
              [title]="type.is_active ? 'Deactivate' : 'Activate'"
            >
              @if (type.is_active) {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              }
              @if (!type.is_active) {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              }
            </button>
            <button
              type="button"
              (click)="handleEdit(type)"
              class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
              title="Edit"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              type="button"
              (click)="handleDelete(type.id, type.name)"
              class="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
              title="Delete"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        }
      </div>
      }

      <!-- Footer Stats -->
      @if (!loading && types.length > 0) {
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">
            Total: <span class="font-semibold">{{ types.length }}</span> type(s)
            @if (getActiveCount() < types.length) {
            <span class="ml-2">
              (<span class="font-semibold">{{ getActiveCount() }}</span> active)
            </span>
            }
          </span>
        </div>
      </div>
      }
      </div>
      <!-- end tour-prayer-types-list-area -->

      </div>
      }

      <!-- Confirmation Dialog -->
      @if (showConfirmationDialog) {
      <app-confirmation-dialog
        [title]="confirmationTitle"
        [message]="confirmationMessage"
        [isDangerous]="confirmationIsDangerous"
        [confirmText]="confirmationConfirmText"
        (confirm)="onConfirmationConfirm()"
        (cancel)="onConfirmationCancel()">
      </app-confirmation-dialog>
      }
    </div>
  `,
  styles: []
})
export class PrayerTypesManagerComponent {
  @Output() onSave = new EventEmitter<void>();

  sectionExpanded = false;
  private sectionInitialLoadDone = false;

  types: PrayerTypeRecord[] = [];
  loading = false;
  showAddForm = false;
  error: string | null = null;
  success: string | null = null;

  // Confirmation dialog properties
  showConfirmationDialog = false;
  confirmationKind: 'delete' | 'toggleBooklet' | 'toggleActive' | null = null;
  confirmationTitle = '';
  confirmationMessage = '';
  confirmationIsDangerous = true;
  confirmationConfirmText = 'Delete';
  confirmationDeleteId: string | null = null;
  /** Row snapshot for toggle confirmations (booklet / active). */
  pendingToggleType: PrayerTypeRecord | null = null;

  // Form state
  editingId: string | null = null;
  name = '';
  displayOrder = 0;
  isActive = true;
  /** Preserved when editing a type (booklet toggle is also on each row). */
  includeInBooklet = false;
  submitting = false;
  reordering = false;

  constructor(
    private supabase: SupabaseService,
    private toast: ToastService,
    private promptService: PromptService,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef
  ) {}

  onSectionToggle(): void {
    this.sectionExpanded = !this.sectionExpanded;
    if (this.sectionExpanded && !this.sectionInitialLoadDone) {
      this.sectionInitialLoadDone = true;
      void this.fetchTypes();
    }
    this.cdr.markForCheck();
  }

  /** Admin help tour: expand section, close add form, load types if needed. */
  async prepareTourInitialState(): Promise<void> {
    this.cancelEdit();
    if (!this.sectionExpanded) {
      this.sectionExpanded = true;
      if (!this.sectionInitialLoadDone) {
        this.sectionInitialLoadDone = true;
        await this.fetchTypes();
      }
      this.cdr.markForCheck();
      return;
    }
    if (!this.sectionInitialLoadDone) {
      this.sectionInitialLoadDone = true;
      await this.fetchTypes();
    }
    this.cdr.markForCheck();
  }

  async fetchTypes() {
    try {
      this.loading = true;
      this.error = null;

      const { data, error } = await this.supabase.directQuery<PrayerTypeRecord>(
        'prayer_types',
        {
          select: '*',
          order: { column: 'display_order', ascending: true },
          timeout: 15000
        }
      );

      if (error) throw error;
      this.types = Array.isArray(data) ? data : (data ? [data] : []);
    } catch (err: unknown) {
      console.error('Error fetching prayer types:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error';
      this.error = message;
      this.sectionExpanded = true;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.editingId = null;
    this.name = '';
    this.displayOrder = 0;
    this.isActive = true;
    this.includeInBooklet = false;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();
  }

  /** Enter in name field submits (single-line). */
  onTypeNameEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') return;
    ke.preventDefault();
    void this.saveType();
  }

  /** Add/update type; click-driven save + CD/toasts align with OnPush + Admin parent. */
  async saveType(event?: Event): Promise<void> {
    event?.preventDefault();

    if (!this.name.trim()) {
      this.error = 'Please enter a type name';
      this.toast.warning('Please enter a type name.');
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
      return;
    }

    try {
      this.submitting = true;
      this.error = null;
      this.success = null;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
      await Promise.resolve();

      if (this.editingId) {
        // Update existing type
        const { error } = await this.supabase.client
          .from('prayer_types')
          .update({
            name: this.name.trim(),
            display_order: this.displayOrder,
            is_active: this.isActive,
            include_in_booklet: this.includeInBooklet
          })
          .eq('id', this.editingId);

        if (error) throw error;
        this.success = 'Prayer type updated successfully!';
        this.toast.success('Prayer type updated.');
      } else {
        // Add new type
        const { error } = await this.supabase.client
          .from('prayer_types')
          .insert({
            name: this.name.trim(),
            display_order: this.displayOrder,
            is_active: this.isActive,
            include_in_booklet: this.includeInBooklet
          });

        if (error) throw error;
        this.success = 'Prayer type added successfully!';
        this.toast.success('Prayer type added.');
      }

      // Reset form
      this.name = '';
      this.displayOrder = 0;
      this.isActive = true;
      this.includeInBooklet = false;
      this.editingId = null;
      this.showAddForm = false;

      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();

      await this.fetchTypes();
      // Reload prompts to reflect type changes on main site
      await this.promptService.loadPrompts();
      this.onSave.emit();
    } catch (err: unknown) {
      console.error('Error saving prayer type:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error';
      this.error = `Failed to save prayer type: ${message}`;
      this.toast.error(`Could not save prayer type: ${message}`);
    } finally {
      this.submitting = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  handleEdit(type: PrayerTypeRecord) {
    this.name = type.name;
    this.displayOrder = type.display_order;
    this.isActive = type.is_active;
    this.includeInBooklet = type.include_in_booklet ?? false;
    this.editingId = type.id;
    this.showAddForm = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();
  }

  async handleDelete(id: string, name: string) {
    this.confirmationKind = 'delete';
    this.confirmationTitle = 'Delete Prayer Type';
    this.confirmationMessage = `Are you sure you want to delete the "${name}" type? This may affect existing prayer prompts using this type.`;
    this.confirmationIsDangerous = true;
    this.confirmationConfirmText = 'Delete';
    this.confirmationDeleteId = id;
    this.pendingToggleType = null;
    this.showConfirmationDialog = true;
    this.cdr.markForCheck();
  }

  /** Opens confirm dialog; avoids CDK drag eating the first interaction on the row. */
  beginIncludeInBookletToggle(type: PrayerTypeRecord, event?: Event) {
    event?.stopPropagation();
    const includeNext = !(type.include_in_booklet ?? false);
    this.confirmationKind = 'toggleBooklet';
    this.pendingToggleType = type;
    this.confirmationDeleteId = null;
    this.confirmationTitle = includeNext ? 'Include in saddle-stitch booklet?' : 'Remove from saddle-stitch booklet?';
    this.confirmationMessage = includeNext
      ? `Include prompts for "${type.name}" in Admin → Tools → Saddle-stitch booklet (after answered prayers)?`
      : `Stop including "${type.name}" prompts in the saddle-stitch booklet printout?`;
    this.confirmationIsDangerous = false;
    this.confirmationConfirmText = 'Confirm';
    this.showConfirmationDialog = true;
    this.cdr.markForCheck();
  }

  /** Opens confirm dialog; avoids CDK drag eating the first interaction on the row. */
  beginActiveToggle(type: PrayerTypeRecord, event?: Event) {
    event?.stopPropagation();
    const activating = !type.is_active;
    this.confirmationKind = 'toggleActive';
    this.pendingToggleType = type;
    this.confirmationDeleteId = null;
    this.confirmationTitle = activating ? 'Activate prayer type?' : 'Deactivate prayer type?';
    this.confirmationMessage = activating
      ? `"${type.name}" will appear in prayer prompt type dropdowns.`
      : `"${type.name}" will be hidden from dropdowns until you activate it again.`;
    this.confirmationIsDangerous = false;
    this.confirmationConfirmText = 'Confirm';
    this.showConfirmationDialog = true;
    this.cdr.markForCheck();
  }

  async onConfirmationConfirm() {
    const kind = this.confirmationKind;
    const deleteId = this.confirmationDeleteId;
    const pendingType = this.pendingToggleType;

    this.showConfirmationDialog = false;
    this.confirmationKind = null;
    this.confirmationDeleteId = null;
    this.pendingToggleType = null;

    if (kind === 'delete') {
      if (!deleteId) return;

      try {
        this.error = null;
        this.success = null;

        const { error } = await this.supabase.client
          .from('prayer_types')
          .delete()
          .eq('id', deleteId);

        if (error) throw error;

        this.success = 'Prayer type deleted successfully!';
        await this.fetchTypes();
        await this.promptService.loadPrompts();
      } catch (err: unknown) {
        console.error('Error deleting prayer type:', err);
        const message = err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Unknown error';
        this.error = message;
      } finally {
        this.cdr.markForCheck();
      }
      return;
    }

    if (kind === 'toggleBooklet') {
      if (!pendingType) return;
      await this.toggleIncludeInBooklet(pendingType);
      return;
    }

    if (kind === 'toggleActive') {
      if (!pendingType) return;
      await this.toggleActive(pendingType);
    }
  }

  onConfirmationCancel() {
    this.showConfirmationDialog = false;
    this.confirmationKind = null;
    this.confirmationDeleteId = null;
    this.pendingToggleType = null;
  }

  async toggleIncludeInBooklet(type: PrayerTypeRecord) {
    try {
      this.error = null;
      this.success = null;

      const { error } = await this.supabase.client
        .from('prayer_types')
        .update({ include_in_booklet: !type.include_in_booklet })
        .eq('id', type.id);

      if (error) throw error;

      await this.fetchTypes();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
    } catch (err: unknown) {
      console.error('Error updating booklet inclusion:', err);
      const message =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unknown error';
      this.error = message;
      this.toast.error(`Could not update booklet setting: ${message}`);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  async toggleActive(type: PrayerTypeRecord) {
    try {
      this.error = null;
      this.success = null;

      const { error } = await this.supabase.client
        .from('prayer_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) throw error;

      this.success = `Prayer type ${!type.is_active ? 'activated' : 'deactivated'} successfully!`;
      await this.fetchTypes();
      // Reload prompts to reflect active status change on main site
      await this.promptService.loadPrompts();
    } catch (err: unknown) {
      console.error('Error toggling prayer type:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error';
      this.error = message;
    } finally {
      this.cdr.markForCheck();
    }
  }

  async onDrop(event: CdkDragDrop<PrayerTypeRecord[]>) {
    if (event.previousIndex === event.currentIndex) return;

    const original = [...this.types];

    // Optimistically update UI
    moveItemInArray(this.types, event.previousIndex, event.currentIndex);
    this.reordering = true;
    this.error = null;

    try {
      // Update display_order for all types to match new order
      const updates = this.types.map((t, idx) =>
        this.supabase.client
          .from('prayer_types')
          .update({ display_order: idx })
          .eq('id', t.id)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errorResult = results.find(r => r.error);
      if (errorResult?.error) throw errorResult.error;

      // Refresh from server to ensure consistency
      await this.fetchTypes();
      // Reload prompts to reflect new order on main site
      await this.promptService.loadPrompts();
    } catch (err: unknown) {
      console.error('Error reordering prayer types:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error';
      this.error = message;
      // Revert optimistic update
      this.types = original;
    } finally {
      this.reordering = false;
      this.cdr.markForCheck();
    }
  }

  cancelEdit() {
    this.showAddForm = false;
    this.editingId = null;
    this.name = '';
    this.displayOrder = 0;
    this.isActive = true;
    this.includeInBooklet = false;
    this.error = null;
    this.cdr.markForCheck();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getActiveCount(): number {
    return this.types.filter(t => t.is_active).length;
  }
}
