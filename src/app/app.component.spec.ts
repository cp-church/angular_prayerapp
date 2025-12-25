import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let mockRouter: any;
  let mockInjector: any;
  let mockNgZone: any;

  beforeEach(() => {
    // Mock Router
    mockRouter = {
      navigate: vi.fn()
    };

    // Mock NgZone
    mockNgZone = {
      run: vi.fn((fn) => fn())
    };

    // Mock Injector
    mockInjector = {
      get: vi.fn()
    };

    // Mock window methods
    global.window.addEventListener = vi.fn();
    global.window.history = {
      replaceState: vi.fn()
    } as any;
    
    // Mock URL parameters
    Object.defineProperty(global.window, 'location', {
      writable: true,
      value: {
        search: '',
        pathname: '/',
        origin: 'http://localhost'
      }
    });

    // Mock localStorage
    const localStorageMock: { [key: string]: string } = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    } as Storage;

    // Instantiate component directly
    component = new (AppComponent as any)(mockRouter, mockInjector, mockNgZone);
  });

  describe('component initialization', () => {
    it('should create the app', () => {
      expect(component).toBeDefined();
    });

    it('should have prayerapp as title', () => {
      expect(component.title).toBe('prayerapp');
    });

    it('should set up global error handler', () => {
      expect(mockNgZone.run).toHaveBeenCalled();
      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('ngOnInit', () => {
    it('should handle approval code on init', () => {
      // Mock no code in URL
      window.location.search = '';
      
      component.ngOnInit();
      
      // Should not navigate when no code
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('handleApprovalCode', () => {
    it('should do nothing when no code is present', async () => {
      window.location.search = '';
      
      await component.ngOnInit();
      
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle existing validated session', async () => {
      window.location.search = '?code=test_code_123';
      localStorage.setItem('approvalAdminEmail', 'test@example.com');
      
      // Mock AdminAuthService
      const mockAdminAuth = {
        setApprovalSession: vi.fn(),
        getIsAdmin: vi.fn(() => Promise.resolve(true))
      };
      
      mockInjector.get = vi.fn((service) => {
        if (service.name === 'AdminAuthService') {
          return mockAdminAuth;
        }
        return null;
      });

      await component.ngOnInit();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(localStorage.getItem).toHaveBeenCalledWith('approvalAdminEmail');
    });
  });

  describe('account approval codes', () => {
    it('should handle account approval code', async () => {
      window.location.search = '?code=account_approve_dGVzdEBleGFtcGxlLmNvbQ==';
      
      // Mock services
      const mockApprovalLinks = {
        decodeAccountCode: vi.fn(() => ({
          email: 'test@example.com',
          type: 'approve'
        }))
      };
      
      const mockSupabase = {
        directQuery: vi.fn(() => Promise.resolve({
          data: [{
            id: '1',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            approval_status: 'pending'
          }],
          error: null
        })),
        directMutation: vi.fn(() => Promise.resolve({ error: null }))
      };
      
      const mockEmailService = {
        getTemplate: vi.fn(() => Promise.resolve(null))
      };
      
      const mockToast = {
        showToast: vi.fn()
      };
      
      mockInjector.get = vi.fn((service) => {
        if (service.name === 'ApprovalLinksService') return mockApprovalLinks;
        if (service.name === 'SupabaseService') return mockSupabase;
        if (service.name === 'EmailNotificationService') return mockEmailService;
        if (service.name === 'ToastService') return mockToast;
        return null;
      });

      await component.ngOnInit();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle account denial code', async () => {
      window.location.search = '?code=account_deny_dGVzdEBleGFtcGxlLmNvbQ==';
      
      const mockApprovalLinks = {
        decodeAccountCode: vi.fn(() => ({
          email: 'test@example.com',
          type: 'deny'
        }))
      };
      
      const mockSupabase = {
        directQuery: vi.fn(() => Promise.resolve({
          data: [{
            id: '1',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            approval_status: 'pending'
          }],
          error: null
        })),
        directMutation: vi.fn(() => Promise.resolve({ error: null }))
      };
      
      const mockEmailService = {
        getTemplate: vi.fn(() => Promise.resolve(null))
      };
      
      const mockToast = {
        showToast: vi.fn()
      };
      
      mockInjector.get = vi.fn((service) => {
        if (service.name === 'ApprovalLinksService') return mockApprovalLinks;
        if (service.name === 'SupabaseService') return mockSupabase;
        if (service.name === 'EmailNotificationService') return mockEmailService;
        if (service.name === 'ToastService') return mockToast;
        return null;
      });

      await component.ngOnInit();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('error handling', () => {
    it('should handle approval code validation errors', async () => {
      window.location.search = '?code=invalid_code';
      
      const mockApprovalLinks = {
        validateApprovalCode: vi.fn(() => Promise.reject(new Error('Invalid code')))
      };
      
      const mockAdminAuth = {
        setApprovalSession: vi.fn()
      };
      
      mockInjector.get = vi.fn((service) => {
        if (service.name === 'ApprovalLinksService') return mockApprovalLinks;
        if (service.name === 'AdminAuthService') return mockAdminAuth;
        return null;
      });

      await component.ngOnInit();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should navigate to login on error
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle invalid account approval code format', async () => {
      window.location.search = '?code=account_approve_invalid';
      
      const mockApprovalLinks = {
        decodeAccountCode: vi.fn(() => null)
      };
      
      const mockToast = {
        showToast: vi.fn()
      };
      
      mockInjector.get = vi.fn((service) => {
        if (service.name === 'ApprovalLinksService') return mockApprovalLinks;
        if (service.name === 'ToastService') return mockToast;
        return null;
      });

      await component.ngOnInit();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('global error handler', () => {
    it('should catch unhandled promise rejections', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Get the event listener that was registered
      const calls = (window.addEventListener as any).mock.calls;
      const unhandledRejectionCall = calls.find((call: any) => call[0] === 'unhandledrejection');
      const handler = unhandledRejectionCall?.[1];
      
      if (handler) {
        handler({ reason: new Error('Test rejection') });
        expect(errorSpy).toHaveBeenCalledWith(
          '[GlobalErrorHandler] Unhandled promise rejection:',
          expect.any(Error)
        );
      }
      
      errorSpy.mockRestore();
    });

    it('should catch global errors', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Get the event listener that was registered
      const calls = (window.addEventListener as any).mock.calls;
      const errorCall = calls.find((call: any) => call[0] === 'error');
      const handler = errorCall?.[1];
      
      if (handler) {
        handler({ error: new Error('Test error') });
        expect(errorSpy).toHaveBeenCalledWith(
          '[GlobalErrorHandler] Global error:',
          expect.any(Error)
        );
      }
      
      errorSpy.mockRestore();
    });
  });
});
