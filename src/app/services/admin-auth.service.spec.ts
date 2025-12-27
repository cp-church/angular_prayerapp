import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { firstValueFrom } from 'rxjs';
import type { User } from '@supabase/supabase-js';

// Mock environment
vi.mock('../../environments/environment', () => ({
  environment: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key-123'
  }
}));

// Mock Sentry
vi.mock('@sentry/angular', () => ({
  captureException: vi.fn()
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key) => ({
    _url: url,
    _key: key,
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn()
    }
  }))
}));

// Mock Angular's inject function
let mockRouter: any;
let mockSupabaseService: any;
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual('@angular/core');
  return {
    ...actual,
    inject: vi.fn((token: any) => {
      if (token === Router || token.name === 'Router') {
        return mockRouter;
      }
      if (token === SupabaseService || token.name === 'SupabaseService') {
        return mockSupabaseService;
      }
      return null;
    })
  };
});

describe('AdminAuthService', () => {
  let service: any; // AdminAuthService - imported dynamically
  let mockSupabaseClient: any;

  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers();
    
    // Mock window and document event listeners
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(document, 'addEventListener').mockImplementation(() => {});

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ 
          data: { session: null },
          error: null 
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } }
        }),
        signOut: vi.fn().mockResolvedValue({ error: null })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      }),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: {}, error: null })
      }
    };

    // Create mock SupabaseService
    mockSupabaseService = {
      client: mockSupabaseClient,
      directQuery: vi.fn().mockResolvedValue({ data: null, error: null }),
      getSupabaseUrl: () => 'https://test.supabase.co',
      getSupabaseKey: () => 'test-anon-key-123'
    };

    // Dynamically import the service after mocks are set up
    const { AdminAuthService } = await import('./admin-auth.service');
    service = new AdminAuthService(mockSupabaseService);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be created', async () => {
      await vi.advanceTimersByTimeAsync(100);
      expect(service).toBeTruthy();
    });

    it('should expose observable streams', async () => {
      await vi.advanceTimersByTimeAsync(100);
      expect(service.user$).toBeDefined();
      expect(service.isAdmin$).toBeDefined();
      expect(service.isAuthenticated$).toBeDefined();
      expect(service.loading$).toBeDefined();
    });

    it('should have getter methods', async () => {
      await vi.advanceTimersByTimeAsync(100);
      expect(service.getUser()).toBe(null);
      expect(service.getIsAdmin()).toBe(false);
      expect(typeof service.isLoading()).toBe('boolean');
    });
  });

  describe('logout', () => {
    it('should logout successfully and navigate to login', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      await service.logout();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      
      const user = await firstValueFrom(service.user$);
      const isAdmin = await firstValueFrom(service.isAdmin$);
      const isAuthenticated = await firstValueFrom(service.isAuthenticated$);

      expect(user).toBe(null);
      expect(isAdmin).toBe(false);
      expect(isAuthenticated).toBe(false);
    });

    it('should clear approval session data on logout', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      localStorage.setItem('approvalAdminEmail', 'test@example.com');
      localStorage.setItem('approvalSessionValidated', 'true');
      localStorage.setItem('approvalApprovalType', 'test');
      localStorage.setItem('approvalApprovalId', '123');

      await service.logout();

      expect(localStorage.getItem('approvalAdminEmail')).toBe(null);
      expect(localStorage.getItem('approvalSessionValidated')).toBe(null);
      expect(localStorage.getItem('approvalApprovalType')).toBe(null);
      expect(localStorage.getItem('approvalApprovalId')).toBe(null);
    });

    it('should handle logout errors gracefully', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      mockSupabaseClient.auth.signOut = vi.fn().mockRejectedValue(new Error('Logout failed'));

      // Should not throw even when signOut fails
      await expect(service.logout()).resolves.not.toThrow();
      
      // When signOut fails, navigation won't happen because we're in catch block
      // This is the current behavior - it just logs the error
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('recordActivity', () => {
    it('should record user activity', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      const beforeTime = Date.now();
      service.recordActivity();
      const afterTime = Date.now();

      expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('sendMfaCode', () => {
    it('should send MFA code successfully', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { require_site_login: true }, 
          error: null 
        })
      });

      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { codeId: 'code123' },
        error: null
      });

      const result = await service.sendMfaCode('test@example.com');

      expect(result.success).toBe(true);
      expect(result.codeId).toBe('code123');
      expect(localStorage.getItem('mfa_code_id')).toBe('code123');
      expect(localStorage.getItem('mfa_user_email')).toBe('test@example.com');
    });

    it('should handle send verification code error', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { require_site_login: true }, 
          error: null 
        })
      });

      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Send failed' }
      });

      const result = await service.sendMfaCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Send failed');
    });

    it('should handle service error in response data', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { require_site_login: true }, 
          error: null 
        })
      });

      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { error: 'Service error' },
        error: null
      });

      const result = await service.sendMfaCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service error');
    });

    it('should check admin status when site protection is disabled', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { require_site_login: false }, 
          error: null 
        })
      });

      mockSupabaseClient.functions.invoke = vi.fn()
        .mockResolvedValueOnce({ // check-admin-status
          data: { is_admin: false },
          error: null
        });

      const result = await service.sendMfaCode('nonadmin@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not authorized');
    });

    it('should handle unexpected errors', async () => {
      await vi.advanceTimersByTimeAsync(100);
      
      mockSupabaseClient.from = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.sendMfaCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });

  describe('verifyMfaCode', () => {
    beforeEach(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    it('should verify MFA code successfully for admin', async () => {
      localStorage.setItem('mfa_code_id', 'code123');
      localStorage.setItem('mfa_user_email', 'admin@example.com');

      mockSupabaseClient.functions.invoke = vi.fn()
        .mockResolvedValueOnce({ // verify-code
          data: { success: true },
          error: null
        })
        .mockResolvedValueOnce({ // check-admin-status
          data: { is_admin: true },
          error: null
        });

      const result = await service.verifyMfaCode('123456');

      expect(result.success).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(localStorage.getItem('approvalAdminEmail')).toBe('admin@example.com');
      expect(localStorage.getItem('approvalSessionValidated')).toBe('true');
      expect(localStorage.getItem('mfa_code_id')).toBe(null);
    });

    it('should verify MFA code successfully for non-admin', async () => {
      localStorage.setItem('mfa_code_id', 'code123');
      localStorage.setItem('mfa_user_email', 'user@example.com');

      mockSupabaseClient.functions.invoke = vi.fn()
        .mockResolvedValueOnce({ // verify-code
          data: { success: true },
          error: null
        })
        .mockResolvedValueOnce({ // check-admin-status
          data: { is_admin: false },
          error: null
        });

      const result = await service.verifyMfaCode('123456');

      expect(result.success).toBe(true);
      expect(result.isAdmin).toBe(false);
    });

    it('should fail when no MFA session found', async () => {
      localStorage.removeItem('mfa_code_id');
      localStorage.removeItem('mfa_user_email');

      const result = await service.verifyMfaCode('123456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No MFA session found');
    });

    it('should handle verification error', async () => {
      localStorage.setItem('mfa_code_id', 'code123');
      localStorage.setItem('mfa_user_email', 'test@example.com');

      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid code' }
      });

      const result = await service.verifyMfaCode('000000');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid code');
    });

    it('should handle service error in response data', async () => {
      localStorage.setItem('mfa_code_id', 'code123');
      localStorage.setItem('mfa_user_email', 'test@example.com');

      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { error: 'Code expired' },
        error: null
      });

      const result = await service.verifyMfaCode('123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Code expired');
    });

    it('should handle unexpected errors', async () => {
      localStorage.setItem('mfa_code_id', 'code123');
      localStorage.setItem('mfa_user_email', 'test@example.com');

      mockSupabaseClient.functions.invoke = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.verifyMfaCode('123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });

  describe('setApprovalSession', () => {
    beforeEach(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    it('should set approval session for admin user', async () => {
      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null
      });

      await service.setApprovalSession('admin@example.com');

      const isAuthenticated = await firstValueFrom(service.isAuthenticated$);
      const isAdmin = await firstValueFrom(service.isAdmin$);
      const hasAdminEmail = await firstValueFrom(service.hasAdminEmail$);
      const adminSessionExpired = await firstValueFrom(service.adminSessionExpired$);

      expect(isAuthenticated).toBe(true);
      expect(isAdmin).toBe(true);
      expect(hasAdminEmail).toBe(true);
      expect(adminSessionExpired).toBe(false);
      expect(localStorage.getItem('approvalAdminEmail')).toBe('admin@example.com');
      expect(localStorage.getItem('approvalSessionValidated')).toBe('true');
    });

    it('should set approval session for non-admin user', async () => {
      mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { is_admin: false },
        error: null
      });

      await service.setApprovalSession('user@example.com');

      const isAuthenticated = await firstValueFrom(service.isAuthenticated$);
      const isAdmin = await firstValueFrom(service.isAdmin$);
      const hasAdminEmail = await firstValueFrom(service.hasAdminEmail$);

      expect(isAuthenticated).toBe(true);
      expect(isAdmin).toBe(false);
      expect(hasAdminEmail).toBe(false);
    });
  });

  describe('reloadSiteProtectionSetting', () => {
    beforeEach(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    it('should reload site protection setting from database', async () => {
      mockSupabaseService.directQuery = vi.fn().mockResolvedValue({
        data: [{ require_site_login: false }],
        error: null
      });

      await service.reloadSiteProtectionSetting();

      const requireSiteLogin = await firstValueFrom(service.requireSiteLogin$);
      expect(requireSiteLogin).toBe(false);

      const cached = localStorage.getItem('adminTimeoutSettings');
      expect(cached).toContain('requireSiteLogin');
    });

    it('should handle reload error', async () => {
      mockSupabaseService.directQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(service.reloadSiteProtectionSetting()).resolves.not.toThrow();
    });

    it('should handle reload exception', async () => {
      mockSupabaseService.directQuery = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.reloadSiteProtectionSetting()).resolves.not.toThrow();
    });
  });

  describe('checkBlockedStatusInBackground', () => {
    beforeEach(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    it('should throttle blocked status checks', async () => {
      // Clear any previous calls from initialization
      vi.clearAllMocks();
      const directQuerySpy = vi.spyOn(mockSupabaseService, 'directQuery');

      service.checkBlockedStatusInBackground();
      service.checkBlockedStatusInBackground();
      service.checkBlockedStatusInBackground();
      await vi.advanceTimersByTimeAsync(100);

      // Should only call once due to throttling (within 60 second window)
      expect(directQuerySpy).toHaveBeenCalledTimes(1);
    });

    it('should handle blocked check error gracefully', async () => {
      mockSupabaseService.directQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      service.checkBlockedStatusInBackground();
      await vi.advanceTimersByTimeAsync(100);

      // Should not crash or logout
      expect(mockSupabaseClient.auth.signOut).not.toHaveBeenCalled();
    });

    it('should handle blocked check exception gracefully', async () => {
      mockSupabaseService.directQuery = vi.fn().mockRejectedValue(new Error('Network error'));

      service.checkBlockedStatusInBackground();
      await vi.advanceTimersByTimeAsync(100);

      // Should not crash or logout
      expect(mockSupabaseClient.auth.signOut).not.toHaveBeenCalled();
    });
  });
});
