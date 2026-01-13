import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * PWAUpdateService manages service worker updates with user control
 * - Detects when new service worker is waiting to activate
 * - Provides user options to update now or later
 * - Prevents automatic reloads that disrupt user activity
 */
@Injectable({
  providedIn: 'root'
})
export class PWAUpdateService {
  private updateAvailableSubject = new BehaviorSubject<boolean>(false);
  private registration: ServiceWorkerRegistration | null = null;

  public updateAvailable$: Observable<boolean> = this.updateAvailableSubject.asObservable();

  constructor() {
    this.initializeUpdateDetection();
  }

  /**
   * Initialize update detection for service worker
   */
  private initializeUpdateDetection(): void {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWAUpdate] Service Worker not supported');
      return;
    }

    // Listen for controller change to reload when update is applied
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWAUpdate] Service worker controller changed, reloading page');
      window.location.reload();
    });

    // Get the registration and check for updates
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) {
        console.log('[PWAUpdate] No service worker registration found');
        return;
      }

      this.registration = reg;
      this.checkForWaitingWorker(reg);
      this.listenForUpdates(reg);
    }).catch((error) => {
      console.error('[PWAUpdate] Error getting service worker registration:', error);
    });
  }

  /**
   * Check if there's already a waiting worker
   */
  private checkForWaitingWorker(registration: ServiceWorkerRegistration): void {
    if (registration.waiting) {
      console.log('[PWAUpdate] Update already available');
      this.updateAvailableSubject.next(true);
    }
  }

  /**
   * Listen for new service worker installations
   */
  private listenForUpdates(registration: ServiceWorkerRegistration): void {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('[PWAUpdate] New service worker installing');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWAUpdate] New service worker installed and waiting');
          this.updateAvailableSubject.next(true);
        }
      });
    });
  }

  /**
   * Check for updates manually
   */
  checkForUpdates(): void {
    if (!this.registration) {
      console.log('[PWAUpdate] No registration available for update check');
      return;
    }

    this.registration.update().catch((error) => {
      console.error('[PWAUpdate] Error checking for updates:', error);
    });
  }

  /**
   * Apply the update immediately
   * Tells the waiting service worker to activate and reloads the page
   */
  applyUpdate(): void {
    if (!this.registration || !this.registration.waiting) {
      console.warn('[PWAUpdate] No update available to apply');
      return;
    }

    console.log('[PWAUpdate] Applying update immediately');
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    // Page will reload when controllerchange event fires
  }

  /**
   * Defer the update until later
   * User can continue using the app, update will apply on next app launch
   */
  deferUpdate(): void {
    console.log('[PWAUpdate] Update deferred, will apply on next app launch');
    this.updateAvailableSubject.next(false);
    // Don't do anything - the waiting worker will activate on next page load naturally
  }

  /**
   * Check if an update is currently available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailableSubject.value;
  }
}
