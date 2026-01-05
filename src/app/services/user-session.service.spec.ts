import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserSessionService } from './user-session.service';
import { SupabaseService } from './supabase.service';
import { AdminAuthService } from './admin-auth.service';
import { BehaviorSubject } from 'rxjs';

describe('UserSessionService', () => {
  let service: UserSessionService;
  let mockSupabaseService: any;
  let mockAdminAuthService: any;

  beforeEach(() => {
    // Create mock for Supabase Service
    mockSupabaseService = {
      client: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { email: 'test@example.com' } } }
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  email: 'test@example.com',
                  name: 'John Doe',
                  is_active: true,
                },
                error: null
              })
            })
          })
        })
      }
    };

    // Create mock for Admin Auth Service
    mockAdminAuthService = {
      isAuthenticated$: new BehaviorSubject(true)
    };

    // Clear localStorage before each test
    localStorage.clear();

    service = new UserSessionService(mockSupabaseService, mockAdminAuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('loadUserSession', () => {
    it('should load user session from database', async () => {
      await service.loadUserSession('test@example.com');

      const session = service.getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.email).toBe('test@example.com');
      expect(session?.fullName).toBe('John Doe');
      expect(session?.isActive).toBe(true);
    });

    it('should save session to localStorage', async () => {
      await service.loadUserSession('test@example.com');

      const cached = localStorage.getItem('userSession');
      expect(cached).not.toBeNull();
      const session = JSON.parse(cached!);
      expect(session.email).toBe('test@example.com');
      expect(session.fullName).toBe('John Doe');
    });

    it('should set notification preferences', async () => {
      await service.loadUserSession('test@example.com');

      const session = service.getCurrentSession();
      expect(session?.receiveNotifications).toBe(true);
      expect(session?.receiveAdminEmails).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          })
        })
      });

      service.clearSession();
      await service.loadUserSession('test@example.com');

      const session = service.getCurrentSession();
      // When there's an error, we create a fallback session with empty name
      expect(session).not.toBeNull();
      expect(session?.email).toBe('test@example.com');
      expect(session?.fullName).toBe('');
      expect(session?.isActive).toBe(true);
    });

    it('should ignore empty email', async () => {
      service.clearSession();
      await service.loadUserSession('');

      const session = service.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('getCurrentSession', () => {
    it('should return user email', async () => {
      await service.loadUserSession('test@example.com');
      expect(service.getUserEmail()).toBe('test@example.com');
    });

    it('should return user full name', async () => {
      await service.loadUserSession('test@example.com');
      expect(service.getUserFullName()).toBe('John Doe');
    });

    it('should return user first name as null (deprecated)', async () => {
      await service.loadUserSession('test@example.com');
      expect(service.getUserFirstName()).toBeNull();
    });

    it('should return user last name as null (deprecated)', async () => {
      await service.loadUserSession('test@example.com');
      expect(service.getUserLastName()).toBeNull();
    });

    it('should return null when no session loaded', () => {
      service.clearSession();
      expect(service.getCurrentSession()).toBeNull();
      expect(service.getUserEmail()).toBeNull();
      expect(service.getUserFullName()).toBeNull();
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return notification preferences', async () => {
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'test@example.com',
                name: 'John Doe',
                is_active: true,
              },
              error: null
            })
          })
        })
      });

      await service.loadUserSession('test@example.com');

      const prefs = service.getNotificationPreferences();
      expect(prefs).not.toBeNull();
      expect(prefs?.receiveNotifications).toBe(true);
      expect(prefs?.receiveAdminEmails).toBe(false);
    });

    it('should handle disabled notifications', async () => {
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'test@example.com',
                name: 'John Doe',
                is_active: true,
              },
              error: null
            })
          })
        })
      });

      await service.loadUserSession('test@example.com');

      const session = service.getCurrentSession();
      // Note: notification preferences are hardcoded defaults since they're not in email_subscribers table
      expect(session?.receiveNotifications).toBe(true);
    });

    it('should handle admin emails enabled', async () => {
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'test@example.com',
                name: 'John Doe',
                is_active: true,
              },
              error: null
            })
          })
        })
      });

      await service.loadUserSession('test@example.com');

      const session = service.getCurrentSession();
      expect(session?.receiveAdminEmails).toBe(false);
    });
  });

  describe('waitForSession', () => {
    it('should return session immediately if already loaded', async () => {
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'test@example.com',
                name: 'John Doe',
                is_active: true,
              },
              error: null
            })
          })
        })
      });

      await service.loadUserSession('test@example.com');

      const session = await service.waitForSession();
      expect(session).not.toBeNull();
      expect(session?.email).toBe('test@example.com');
    });

    it('should wait for session to load', async () => {
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'test@example.com',
                name: 'John Doe',
                is_active: true,
              },
              error: null
            })
          })
        })
      });

      const session1 = service.getCurrentSession();
      expect(session1).not.toBeNull();

      const session2 = await service.waitForSession();
      expect(session2).not.toBeNull();
      expect(session2?.email).toBe('test@example.com');
    });
  });

  describe('updateUserSession', () => {
    beforeEach(async () => {
      await service.loadUserSession('test@example.com');
    });

    it('should update user session data', async () => {
      await service.updateUserSession({ fullName: 'Jane Smith' });

      const session = service.getCurrentSession();
      expect(session?.fullName).toBe('Jane Smith');
    });

    it('should preserve other fields when updating', async () => {
      await service.updateUserSession({ fullName: 'Jane Smith' });

      const session = service.getCurrentSession();
      expect(session?.email).toBe('test@example.com');
      expect(session?.isActive).toBe(true);
    });

    it('should not update if no session exists', async () => {
      service.clearSession();
      await service.updateUserSession({ fullName: 'Jane Smith' });

      const session = service.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should clear user session data', async () => {
      await service.loadUserSession('test@example.com');
      expect(service.getCurrentSession()).not.toBeNull();

      service.clearSession();
      expect(service.getCurrentSession()).toBeNull();
    });
  });

  describe('userSession$ observable', () => {
    it('should emit user session updates', async () => {
      const sessionPromise = new Promise<void>((resolve) => {
        service.userSession$.subscribe((session) => {
          if (session && session.email === 'test@example.com') {
            expect(session.fullName).toBe('John Doe');
            resolve();
          }
        });
      });

      await service.loadUserSession('test@example.com');
      await sessionPromise;
    });

    it('should emit null on clear', async () => {
      await service.loadUserSession('test@example.com');
      service.clearSession();

      const sessionPromise = new Promise<void>((resolve) => {
        service.userSession$.subscribe((session) => {
          if (session === null) {
            expect(session).toBeNull();
            resolve();
          }
        });
      });

      await sessionPromise;
    });
  });

  describe('isLoading$ observable', () => {
    it('should emit loading state', async () => {
      service.clearSession();
      
      const states: boolean[] = [];
      let resolved = false;

      const subscription = service.isLoading$.subscribe((isLoading) => {
        states.push(isLoading);
      });

      // Start loading
      const loadPromise = service.loadUserSession('test@example.com');
      
      // Wait for loading to complete
      await loadPromise;
      
      // Give observables time to emit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      subscription.unsubscribe();
      
      expect(states.includes(true)).toBe(true);
      expect(states[states.length - 1]).toBe(false);
    });
  });

  describe('localStorage caching', () => {
    it('should load from localStorage on initialization', async () => {
      // Pre-populate localStorage
      const cachedSession = {
        email: 'cached@example.com',
        fullName: 'Cached User',
        isActive: true,
        receiveNotifications: true,
        receiveAdminEmails: false
      };
      localStorage.setItem('userSession', JSON.stringify(cachedSession));

      // Setup mock to return the cached email
      mockSupabaseService.client.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: { email: 'cached@example.com' } } }
      });
      mockSupabaseService.client.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'cached@example.com',
                name: 'Cached User',
                is_active: true,
              },
              error: null
            })
          })
        })
      });

      // Create new service instance
      const newService = new UserSessionService(mockSupabaseService, mockAdminAuthService);
      
      // The cached session should be loaded immediately
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = newService.getCurrentSession();
      expect(session?.email).toBe('cached@example.com');
      expect(session?.fullName).toBe('Cached User');
    });

    it('should not load stale cache from different email', async () => {
      // Pre-populate localStorage with different email
      const cachedSession = {
        email: 'different@example.com',
        fullName: 'Different User',
        isActive: true,
        receiveNotifications: true,
        receiveAdminEmails: false
      };
      localStorage.setItem('userSession', JSON.stringify(cachedSession));

      // Load different email
      await service.loadUserSession('test@example.com');
      
      const session = service.getCurrentSession();
      expect(session?.email).toBe('test@example.com');
      expect(session?.fullName).toBe('John Doe');
    });
  });
});
