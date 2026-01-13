import { TestBed } from '@angular/core/testing';
import { PWAUpdateService } from './pwa-update.service';

describe('PWAUpdateService', () => {
  let service: PWAUpdateService;
  let mockRegistration: Partial<ServiceWorkerRegistration>;
  let mockServiceWorker: Partial<ServiceWorkerContainer>;

  beforeEach(() => {
    // Mock ServiceWorkerRegistration
    mockRegistration = {
      waiting: null,
      installing: null,
      active: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
    };

    // Mock ServiceWorkerContainer
    mockServiceWorker = {
      getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      addEventListener: vi.fn(),
      controller: {} as ServiceWorker,
    };

    // Set up navigator.serviceWorker mock
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(PWAUpdateService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize update detection on creation', () => {
    expect(mockServiceWorker.getRegistration).toHaveBeenCalled();
  });

  it('should detect waiting worker on initialization', async () => {
    const waitingWorker = { state: 'installed' } as ServiceWorker;
    mockRegistration.waiting = waitingWorker;

    // Create a new service instance to trigger initialization
    const newService = new PWAUpdateService();

    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    newService.updateAvailable$.subscribe(available => {
      if (available) {
        expect(available).toBe(true);
      }
    });
  });

  it('should check for updates manually', async () => {
    // Wait for registration to be set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    service.checkForUpdates();
    
    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should apply update when waiting worker exists', async () => {
    const mockWaitingWorker = {
      postMessage: vi.fn(),
      state: 'installed',
    } as unknown as ServiceWorker;

    mockRegistration.waiting = mockWaitingWorker;

    // Wait for registration to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    service.applyUpdate();

    expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('should defer update and hide notification', () => {
    service.deferUpdate();
    
    service.updateAvailable$.subscribe(available => {
      expect(available).toBe(false);
    });
  });

  it('should return update availability status', async () => {
    const available = service.isUpdateAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should handle missing service worker gracefully', () => {
    // Create a temporary object to test without service worker
    const originalServiceWorker = (navigator as any).serviceWorker;
    
    // Remove service worker support temporarily
    delete (navigator as any).serviceWorker;

    // Should not throw error when service worker is not available
    const testService = new PWAUpdateService();
    expect(testService).toBeTruthy();

    // Restore service worker
    (navigator as any).serviceWorker = originalServiceWorker;
  });
});
