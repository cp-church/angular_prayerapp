import { describe, it, expect } from 'vitest';
import { PWAUpdateNotificationComponent } from './pwa-update-notification.component';

describe('PWAUpdateNotificationComponent', () => {
  // Component rendering is tested through e2e tests
  // Unit tests focus on the PWAUpdateService which provides the functionality

  it('should be defined as a standalone component', () => {
    expect(PWAUpdateNotificationComponent).toBeDefined();
  });

  it('should have the correct selector', () => {
    const metadata = (PWAUpdateNotificationComponent as any).ɵcmp;
    expect(metadata?.selectors?.[0]?.[0]).toBe('app-pwa-update-notification');
  });
});

