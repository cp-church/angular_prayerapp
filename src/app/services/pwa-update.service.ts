import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { filter, first } from 'rxjs/operators';

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

  public updateAvailable$: Observable<boolean> = this.updateAvailableSubject.asObservable();

  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef
  ) {
    this.initializeUpdateDetection();
  }

  /**
   * Initialize update detection for service worker
   */
  private initializeUpdateDetection(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('[PWAUpdate] Service Worker updates not enabled (likely in development mode)');
      return;
    }

    console.log('[PWAUpdate] Service Worker updates enabled, initializing update detection...');

    // Listen for version updates (when new version is ready)
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(event => {
        console.log('[PWAUpdate] New version available:', event.latestVersion);
        this.updateAvailableSubject.next(true);
      });

    // Check for updates when app stabilizes and then periodically every 5 minutes
    this.appRef.isStable
      .pipe(
        first(isStable => isStable === true), // Wait for app to stabilize
      )
      .subscribe(() => {
        console.log('[PWAUpdate] App stabilized, starting update check schedule');
        
        // Check immediately when app stabilizes
        this.performUpdateCheck();
        
        // Then check periodically every 5 minutes
        interval(5 * 60 * 1000).subscribe(() => {
          console.log('[PWAUpdate] Periodic update check (every 5 minutes)');
          this.performUpdateCheck();
        });
      });
  }

  /**
   * Internal method to perform update check with logging
   */
  private async performUpdateCheck(): Promise<void> {
    try {
      console.log('[PWAUpdate] Checking for updates...');
      const updateFound = await this.swUpdate.checkForUpdate();
      console.log('[PWAUpdate] Update check result:', updateFound ? 'Update found!' : 'No update available');
    } catch (err) {
      console.error('[PWAUpdate] Failed to check for updates:', err);
    }
  }

  /**
   * Check for updates manually
   */
  checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('[PWAUpdate] Service Worker not enabled');
      return;
    }

    this.swUpdate.checkForUpdate().catch((error) => {
      console.error('[PWAUpdate] Error checking for updates:', error);
    });
  }

  /**
   * Apply the update immediately
   * Activates the new service worker and reloads the page
   */
  applyUpdate(): void {
    if (!this.swUpdate.isEnabled) {
      console.warn('[PWAUpdate] Service Worker not enabled');
      return;
    }

    console.log('[PWAUpdate] Applying update immediately');
    this.swUpdate.activateUpdate().then(() => {
      console.log('[PWAUpdate] Update activated, reloading page');
      window.location.reload();
    }).catch(err => {
      console.error('[PWAUpdate] Failed to activate update:', err);
    });
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
