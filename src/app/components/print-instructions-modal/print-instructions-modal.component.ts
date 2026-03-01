import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-instructions-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Modal Backdrop -->
      <div class="fixed inset-0 bg-black/50 z-40" (click)="onClose()" aria-hidden="true"></div>

      <!-- Modal Container -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-modal-title"
      >
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full pointer-events-auto">
          <!-- Header -->
          <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <h2 id="print-modal-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Printing on Android
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Printing is not available in the native app
            </p>
          </div>

          <!-- Content -->
          <div class="px-6 py-3">
            <div class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Use the Web Version
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Open Prayer App in your browser and use the Print button there for full printing support.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex gap-3">
            <button
              (click)="onClose()"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors font-medium cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PrintInstructionsModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  onClose(): void {
    this.closeModal.emit();
  }
}
