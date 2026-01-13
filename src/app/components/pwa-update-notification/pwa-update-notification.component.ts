import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PWAUpdateService } from '../../services/pwa-update.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * PWAUpdateNotificationComponent
 * Displays a notification banner when a PWA update is available
 * Gives users control over when to apply updates
 */
@Component({
  selector: 'app-pwa-update-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      @if (updateAvailable) {
        <div class="fixed bottom-0 left-0 right-0 z-50 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-200 dark:border-blue-800 px-4 py-4 shadow-lg animate-slide-up">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
            <!-- Message -->
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                  A new version of this app is available
                </p>
                <p class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Update now to get the latest features and improvements
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button
                (click)="deferUpdate()"
                class="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
                aria-label="Update later"
              >
                Later
              </button>
              <button
                (click)="applyUpdate()"
                class="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 shadow-sm"
                aria-label="Update now"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `]
})
export class PWAUpdateNotificationComponent implements OnInit, OnDestroy {
  updateAvailable = false;
  private destroy$ = new Subject<void>();

  constructor(private pwaUpdateService: PWAUpdateService) {}

  ngOnInit(): void {
    // Listen for update availability
    this.pwaUpdateService.updateAvailable$
      .pipe(takeUntil(this.destroy$))
      .subscribe((available) => {
        this.updateAvailable = available;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * User chooses to apply update now
   */
  applyUpdate(): void {
    this.pwaUpdateService.applyUpdate();
  }

  /**
   * User chooses to defer update
   */
  deferUpdate(): void {
    this.pwaUpdateService.deferUpdate();
  }
}
