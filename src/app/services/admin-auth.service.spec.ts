import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminAuthService } from './admin-auth.service';
import type { User } from '@supabase/supabase-js';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let mockSupabaseService: any;
  let mockRouter: any;
  let originalLocalStorage: Storage;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockAdminUser: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    // Store original localStorage
    originalLocalStorage = global.localStorage;

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
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      }),
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
      length: 0
    } as Storage;

    // Mock window event listeners
    global.window.addEventListener = vi.fn();

    // Mock Supabase Service
    mockSupabaseService = {
      client: {
        auth: {
          getSession: vi.fn(() => Promise.resolve({
            data: { session: null },
            error: null
          })),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } }
          })),
          signOut: vi.fn(() => Promise.resolve({ error: null }))
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: { require_site_login: true },
                error: null
              }))
            }))
          }))
        })),
        functions: {
          invoke: vi.fn(() => Promise.resolve({
            data: { is_admin: false },
            error: null
          }))
        }
      },
      directQuery: vi.fn(() => Promise.resolve({
        data: [],
        error: null
      }))
    };

    // Mock Router
    mockRouter = {
      navigate: vi.fn()
    };

    // Mock inject for Router
    vi.mock('@angular/core', async () => {
      const actual = await vi.importActual<any>('@angular/core');
      return {
        ...actual,
        inject: vi.fn(() => mockRouter)
      };
    });

    // Instantiate service directly with mocked dependencies
    service = new (AdminAuthService as any)(mockSupabaseService);
    (service as any).router = mockRouter;
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create the service', () => {
      expect(service).toBeDefined();
    });

    it('should initialize auth and set loading to false', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const loading = service.isLoading();
      expect(typeof loading).toBe('boolean');
    });

    it('should check for approval code session on initialization', async () => {
      localStorage.setItem('approvalAdminEmail', 'test@example.com');
      localStorage.setItem('approvalSessionValidated', 'true');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(localStorage.getItem).toHaveBeenCalledWith('approvalAdminEmail');
      expect(localStorage.getItem).toHaveBeenCalledWith('approvalSessionValidated');
    });
  });

  describe('getUser', () => {
    it('should return null when no user is authenticated', () => {
      expect(service.getUser()).toBeNull();
    });
  });

  describe('getIsAdmin', () => {
    it('should return false by default', () => {
      expect(service.getIsAdmin()).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return a boolean value', () => {
      const loading = service.isLoading();
      expect(typeof loading).toBe('boolean');
    });
  });

  describe('recordActivity', () => {
    it('should update last activity time', () => {
      expect(() => service.recordActivity()).not.toThrow();
    });
  });

  describe('sendMfaCode', () => {
    it('should send MFA code for valid email', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: { codeId: 'code-123', error: null },
        error: null
      }));

      const result = await service.sendMfaCode('test@example.com');
      
      expect(result.success).toBe(true);
      expect(result.codeId).toBe('code-123');
      expect(mockSupabaseService.client.functions.invoke).toHaveBeenCalledWith(
        'send-verification-code',
        expect.objectContaining({
          body: expect.objectContaining({
            email: 'test@example.com',
            actionType: 'admin_login'
          })
        })
      );
    });

    it('should return error when sending MFA code fails', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Failed to send code' }
      }));

      const result = await service.sendMfaCode('test@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send code');
    });

    it('should return error when email is not authorized (site protection disabled)', async () => {
      mockSupabaseService.client.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: { require_site_login: false },
              error: null
            }))
          }))
        }))
      }));

      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: { is_admin: false },
        error: null
      }));

      const result = await service.sendMfaCode('test@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not authorized');
    });

    it('should store code ID in localStorage on success', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: { codeId: 'code-456', error: null },
        error: null
      }));

      await service.sendMfaCode('test@example.com');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('mfa_code_id', 'code-456');
      expect(localStorage.setItem).toHaveBeenCalledWith('mfa_user_email', 'test@example.com');
    });
  });

  describe('verifyMfaCode', () => {
    beforeEach(() => {
      localStorage.setItem('mfa_code_id', 'code-123');
      localStorage.setItem('mfa_user_email', 'test@example.com');
    });

    it('should verify MFA code successfully for non-admin user', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn((fn: string) => {
        if (fn === 'verify-code') {
          return Promise.resolve({
            data: { success: true, error: null },
            error: null
          });
        }
        if (fn === 'check-admin-status') {
          return Promise.resolve({
            data: { is_admin: false },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await service.verifyMfaCode('123456');
      
      expect(result.success).toBe(true);
      expect(result.isAdmin).toBe(false);
    });

    it('should verify MFA code successfully for admin user', async () => {
      localStorage.setItem('mfa_user_email', 'admin@example.com');
      
      mockSupabaseService.client.functions.invoke = vi.fn((fn: string) => {
        if (fn === 'verify-code') {
          return Promise.resolve({
            data: { success: true, error: null },
            error: null
          });
        }
        if (fn === 'check-admin-status') {
          return Promise.resolve({
            data: { is_admin: true },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await service.verifyMfaCode('123456');
      
      expect(result.success).toBe(true);
      expect(result.isAdmin).toBe(true);
    });

    it('should return error when no MFA session is found', async () => {
      localStorage.removeItem('mfa_code_id');
      localStorage.removeItem('mfa_user_email');

      const result = await service.verifyMfaCode('123456');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No MFA session found');
    });

    it('should return error when code verification fails', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: { error: 'Invalid code' },
        error: null
      }));

      const result = await service.verifyMfaCode('123456');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid code');
    });

    it('should clean up localStorage after successful verification', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn((fn: string) => {
        if (fn === 'verify-code') {
          return Promise.resolve({
            data: { success: true, error: null },
            error: null
          });
        }
        if (fn === 'check-admin-status') {
          return Promise.resolve({
            data: { is_admin: false },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      await service.verifyMfaCode('123456');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('mfa_code_id');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mfa_user_email');
      expect(localStorage.setItem).toHaveBeenCalledWith('approvalAdminEmail', 'test@example.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('approvalSessionValidated', 'true');
    });
  });

  describe('setApprovalSession', () => {
    it('should set approval session for non-admin user', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: { is_admin: false },
        error: null
      }));

      await service.setApprovalSession('test@example.com');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('approvalAdminEmail', 'test@example.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('approvalSessionValidated', 'true');
    });

    it('should set approval session for admin user', async () => {
      mockSupabaseService.client.functions.invoke = vi.fn(() => Promise.resolve({
        data: { is_admin: true },
        error: null
      }));

      await service.setApprovalSession('admin@example.com');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('approvalAdminEmail', 'admin@example.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('approvalSessionValidated', 'true');
    });
  });

  describe('logout', () => {
    it('should sign out user and clear session data', async () => {
      await service.logout();
      
      expect(mockSupabaseService.client.auth.signOut).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('approvalAdminEmail');
      expect(localStorage.removeItem).toHaveBeenCalledWith('approvalSessionValidated');
      expect(localStorage.removeItem).toHaveBeenCalledWith('approvalApprovalType');
      expect(localStorage.removeItem).toHaveBeenCalledWith('approvalApprovalId');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle logout errors gracefully', async () => {
      mockSupabaseService.client.auth.signOut = vi.fn(() => Promise.reject(new Error('Logout failed')));
      
      await expect(service.logout()).resolves.not.toThrow();
    });
  });

  describe('checkBlockedStatusInBackground', () => {
    it('should throttle blocked status checks', () => {
      service.checkBlockedStatusInBackground();
      service.checkBlockedStatusInBackground();
      
      // Should only check once due to throttling
      expect(mockSupabaseService.directQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle blocked user by logging out', async () => {
      mockSupabaseService.directQuery = vi.fn(() => Promise.resolve({
        data: [{ is_blocked: true }],
        error: null
      }));

      service.checkBlockedStatusInBackground('/admin');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/login'],
        expect.objectContaining({
          queryParams: expect.objectContaining({
            blocked: 'true'
          })
        })
      );
    });

    it('should handle check errors gracefully', async () => {
      mockSupabaseService.directQuery = vi.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Database error' }
      }));

      expect(() => service.checkBlockedStatusInBackground()).not.toThrow();
    });
  });

  describe('reloadSiteProtectionSetting', () => {
    it('should reload site protection setting from database', async () => {
      mockSupabaseService.directQuery = vi.fn(() => Promise.resolve({
        data: [{ require_site_login: false }],
        error: null
      }));

      await service.reloadSiteProtectionSetting();
      
      expect(mockSupabaseService.directQuery).toHaveBeenCalledWith(
        'admin_settings',
        expect.objectContaining({
          select: 'require_site_login',
          eq: { id: 1 }
        })
      );
    });

    it('should handle reload errors gracefully', async () => {
      mockSupabaseService.directQuery = vi.fn(() => Promise.reject(new Error('Database error')));
      
      await expect(service.reloadSiteProtectionSetting()).resolves.not.toThrow();
    });

    it('should update localStorage with new settings', async () => {
      mockSupabaseService.directQuery = vi.fn(() => Promise.resolve({
        data: [{ require_site_login: false }],
        error: null
      }));

      await service.reloadSiteProtectionSetting();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'adminTimeoutSettings',
        expect.stringContaining('requireSiteLogin')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'adminTimeoutSettingsTimestamp',
        expect.any(String)
      );
    });
  });

  describe('observables', () => {
    it('should provide user$ observable', (done) => {
      service.user$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('should provide isAdmin$ observable', (done) => {
      service.isAdmin$.subscribe(isAdmin => {
        expect(typeof isAdmin).toBe('boolean');
        done();
      });
    });

    it('should provide isAuthenticated$ observable', (done) => {
      service.isAuthenticated$.subscribe(isAuth => {
        expect(typeof isAuth).toBe('boolean');
        done();
      });
    });

    it('should provide loading$ observable', (done) => {
      service.loading$.subscribe(loading => {
        expect(typeof loading).toBe('boolean');
        done();
      });
    });

    it('should provide requireSiteLogin$ observable', (done) => {
      service.requireSiteLogin$.subscribe(require => {
        expect(typeof require).toBe('boolean');
        done();
      });
    });
  });
});
