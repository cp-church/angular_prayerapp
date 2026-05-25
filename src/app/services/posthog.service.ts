import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { capturePostHogPageview, initializePostHog } from '../../lib/posthog';

@Injectable({ providedIn: 'root' })
export class PosthogService {
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      initializePostHog();
      capturePostHogPageview(this.router.url);
    });
    this.setupPageviewCapture();
  }

  private setupPageviewCapture(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.ngZone.runOutsideAngular(() => {
          capturePostHogPageview(event.urlAfterRedirects);
        });
      });
  }
}
