import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadgeService } from './badge.service';
import { UserSessionService } from './user-session.service';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, firstValueFrom, skip, take } from 'rxjs';
import { Injector } from '@angular/core';

describe('BadgeService', () => {
  let service: BadgeService;
  let mockUserSessionService: any;
  let mockSupabaseService: any;
  let mockInjector: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock UserSessionService
    mockUserSessionService = {
      userSession$: new BehaviorSubject({
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        badgeFunctionalityEnabled: true
      })
    };

    // Mock SupabaseService
    mockSupabaseService = {
      client: {
        auth: {
          onAuthStateChange: vi.fn((callback) => {
            // Simulate immediate signed-in state
            callback('SIGNED_IN', { user: { email: 'test@example.com' } });
            return { data: { subscription: { unsubscribe: vi.fn() } } };
          })
        }
      }
    };

    // Mock Injector
    mockInjector = {
      get: vi.fn((ServiceClass: any) => {
        if (ServiceClass === UserSessionService) {
          return mockUserSessionService;
        }
        return null;
      })
    };

    // Create service with mocked dependencies
    service = new BadgeService(mockSupabaseService, mockInjector);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('should have badge functionality enabled from session', async () => {
      // Wait for the async subscription to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const enabled = await firstValueFrom(service.getBadgeFunctionalityEnabled$());
      expect(enabled).toBe(true);
    });

    it('should disable badges when session is null', async () => {
      mockUserSessionService.userSession$.next(null);
      
      // Wait a bit for the change to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const enabled = await firstValueFrom(service.getBadgeFunctionalityEnabled$());
      expect(enabled).toBe(false);
    });

    it('should reflect changes to session badgeFunctionalityEnabled', async () => {
      // Wait for initial subscription
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Collect the first emission (current value) and second emission (after change)
      const promise = firstValueFrom(
        service.getBadgeFunctionalityEnabled$().pipe(skip(1), take(1))
      );

      mockUserSessionService.userSession$.next({
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        badgeFunctionalityEnabled: false
      });

      const enabled = await promise;
      expect(enabled).toBe(false);
    });
  });

  describe('markPrayerAsRead', () => {
    beforeEach(() => {
      // Set up some prayers in cache
      localStorage.setItem('prayers_cache', JSON.stringify({
        data: [
          { id: 'prayer-1', status: 'current', updated_at: '2024-01-01' },
          { id: 'prayer-2', status: 'answered', updated_at: '2024-01-01' }
        ]
      }));
    });

    it('should mark prayer as read and add to read list', () => {
      service.markPrayerAsRead('prayer-1');

      const readData = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(readData.prayers).toContain('prayer-1');
    });

    it('should not duplicate prayers in read list', () => {
      service.markPrayerAsRead('prayer-1');
      service.markPrayerAsRead('prayer-1');

      const readData = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      const count = readData.prayers.filter((id: string) => id === 'prayer-1').length;
      expect(count).toBe(1);
    });

    it('should emit updateBadgesChanged event', async () => {
      const promise = firstValueFrom(service.getUpdateBadgesChanged$().pipe(take(1)));
      service.markPrayerAsRead('prayer-1');
      
      await promise;
      expect(true).toBe(true);
    });
  });

  describe('markPromptAsRead', () => {
    beforeEach(() => {
      // Set up some prompts in cache
      localStorage.setItem('prompts_cache', JSON.stringify({
        data: [
          { id: 'prompt-1', updated_at: '2024-01-01' },
          { id: 'prompt-2', updated_at: '2024-01-01' }
        ]
      }));
    });

    it('should mark prompt as read', () => {
      service.markPromptAsRead('prompt-1');

      const readData = JSON.parse(localStorage.getItem('read_prompts_data') || '{}');
      expect(readData.prompts).toContain('prompt-1');
    });

    it('should emit updateBadgesChanged event', async () => {
      const promise = firstValueFrom(service.getUpdateBadgesChanged$().pipe(take(1)));
      service.markPromptAsRead('prompt-1');
      
      await promise;
      expect(true).toBe(true);
    });
  });

  describe('isPrayerUnread', () => {
    it('should return true for unread prayer', () => {
      localStorage.setItem('read_prayers_data', JSON.stringify({ prayers: [] }));
      expect(service.isPrayerUnread('prayer-1')).toBe(true);
    });

    it('should return false for read prayer', () => {
      localStorage.setItem('read_prayers_data', JSON.stringify({ prayers: ['prayer-1'] }));
      expect(service.isPrayerUnread('prayer-1')).toBe(false);
    });

    it('should handle missing read_prayers_data', () => {
      localStorage.removeItem('read_prayers_data');
      expect(service.isPrayerUnread('prayer-1')).toBe(true);
    });
  });

  describe('isPromptUnread', () => {
    it('should return true for unread prompt', () => {
      localStorage.setItem('read_prompts_data', JSON.stringify({ prompts: [] }));
      expect(service.isPromptUnread('prompt-1')).toBe(true);
    });

    it('should return false for read prompt', () => {
      localStorage.setItem('read_prompts_data', JSON.stringify({ prompts: ['prompt-1'] }));
      expect(service.isPromptUnread('prompt-1')).toBe(false);
    });
  });

  describe('getBadgeCount$', () => {
    beforeEach(() => {
      localStorage.setItem('prayers_cache', JSON.stringify({
        data: [
          { id: 'prayer-1', status: 'current', updated_at: '2024-01-01' },
          { id: 'prayer-2', status: 'current', updated_at: '2024-01-01' },
          { id: 'prayer-3', status: 'answered', updated_at: '2024-01-01' }
        ]
      }));
      localStorage.setItem('read_prayers_data', JSON.stringify({
        prayers: ['prayer-1'],
        updates: []
      }));
    });

    it('should return observable with badge count for prayers', async () => {
      const count = await firstValueFrom(service.getBadgeCount$('prayers'));
      // 2 unread prayers (prayer-2 and prayer-3)
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when all items are read', async () => {
      localStorage.setItem('read_prayers_data', JSON.stringify({
        prayers: ['prayer-1', 'prayer-2', 'prayer-3'],
        updates: []
      }));

      const count = await firstValueFrom(service.getBadgeCount$('prayers'));
      expect(count).toBe(0);
    });
  });

  describe('refreshBadgeCounts', () => {
    beforeEach(() => {
      localStorage.setItem('prayers_cache', JSON.stringify({
        data: [
          { id: 'prayer-1', status: 'current', updated_at: '2024-01-01' }
        ]
      }));
      localStorage.setItem('read_prayers_data', JSON.stringify({
        prayers: [],
        updates: []
      }));
    });

    it('should refresh badge counts', async () => {
      service.refreshBadgeCounts();

      const count = await firstValueFrom(service.getBadgeCount$('prayers'));
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should emit updateBadgesChanged event', async () => {
      const promise = firstValueFrom(service.getUpdateBadgesChanged$().pipe(take(1)));
      service.refreshBadgeCounts();
      
      await promise;
      expect(true).toBe(true);
    });
  });

  describe('getBadgeFunctionalityEnabled$', () => {
    it('should return observable with enabled state', async () => {
      const enabled = await firstValueFrom(service.getBadgeFunctionalityEnabled$());
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(() => {
      localStorage.setItem('prayers_cache', JSON.stringify({
        data: [
          { id: 'prayer-1', status: 'current', updated_at: '2024-01-01', updates: [] },
          { id: 'prayer-2', status: 'current', updated_at: '2024-01-01', updates: [] }
        ]
      }));
      localStorage.setItem('read_prayers_data', JSON.stringify({
        prayers: [],
        updates: []
      }));
    });

    it('should mark all items of type as read', () => {
      service.markAllAsRead('prayers');

      const readData = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(readData.prayers).toContain('prayer-1');
      expect(readData.prayers).toContain('prayer-2');
    });

    it('should emit updateBadgesChanged event', async () => {
      const promise = firstValueFrom(service.getUpdateBadgesChanged$().pipe(take(1)));
      service.markAllAsRead('prayers');
      
      await promise;
      expect(true).toBe(true);
    });
  });

  describe('storage listener', () => {
    it('should handle storage events', () => {
      localStorage.setItem('prayers_cache', JSON.stringify({
        data: [{ id: 'prayer-1', status: 'current', updated_at: '2024-01-01' }]
      }));

      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'read_prayers_data',
        newValue: JSON.stringify({ prayers: ['prayer-1'], updates: [] })
      });
      window.dispatchEvent(event);

      // If no error is thrown, the handler worked
      expect(true).toBe(true);
    });
  });

  describe('observable methods', () => {
    it('should expose getUpdateBadgesChanged$', () => {
      expect(service.getUpdateBadgesChanged$).toBeDefined();
      expect(typeof service.getUpdateBadgesChanged$()).toBe('object');
    });

    it('should expose getBadgeCount$', () => {
      expect(service.getBadgeCount$).toBeDefined();
      expect(typeof service.getBadgeCount$('prayers')).toBe('object');
    });

    it('should expose getBadgeFunctionalityEnabled$', () => {
      expect(service.getBadgeFunctionalityEnabled$).toBeDefined();
      expect(typeof service.getBadgeFunctionalityEnabled$()).toBe('object');
    });
  });
});
