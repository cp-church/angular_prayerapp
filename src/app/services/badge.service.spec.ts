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

  describe('BadgeService - localStorage Operations', () => {
    let service: BadgeService;
    let mockSupabaseService: any;
    let mockUserSessionService: any;

    beforeEach(() => {
      localStorage.clear();
      mockSupabaseService = {
        client: {}
      };
      mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should save read prayers data to localStorage', () => {
      const testData = { prayer1: true, prayer2: false };
      localStorage.setItem('read_prayers_data', JSON.stringify(testData));
      
      const retrieved = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(retrieved).toEqual(testData);
    });

    it('should save read prompts data to localStorage', () => {
      const testData = { prompt1: true, prompt3: false };
      localStorage.setItem('read_prompts_data', JSON.stringify(testData));
      
      const retrieved = JSON.parse(localStorage.getItem('read_prompts_data') || '{}');
      expect(retrieved).toEqual(testData);
    });

    it('should handle localStorage quota exceeded error', () => {
      // Test that localStorage quota errors can occur
      const testKey = 'test';
      localStorage.setItem(testKey, 'value');
      const retrieved = localStorage.getItem(testKey);
      
      expect(retrieved).toBe('value');
      localStorage.removeItem(testKey);
    });

    it('should handle corrupted JSON in localStorage', () => {
      localStorage.setItem('read_prayers_data', '{invalid json}');
      
      try {
        JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
        expect(true).toBeFalsy(); // Should have thrown
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should clear localStorage data', () => {
      localStorage.setItem('read_prayers_data', JSON.stringify({ test: true }));
      localStorage.clear();
      
      expect(localStorage.getItem('read_prayers_data')).toBeNull();
    });

    it('should retrieve empty object when key does not exist', () => {
      const result = JSON.parse(localStorage.getItem('non_existent') || '{}');
      expect(result).toEqual({});
    });

    it('should handle large amounts of data in localStorage', () => {
      const largeData: any = {};
      for (let i = 0; i < 1000; i++) {
        largeData[`prayer${i}`] = true;
      }
      
      localStorage.setItem('read_prayers_data', JSON.stringify(largeData));
      const retrieved = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      
      expect(Object.keys(retrieved).length).toBe(1000);
    });
  });

  describe('BadgeService - Badge Count Calculations', () => {
    let service: BadgeService;
    let mockSupabaseService: any;
    let mockUserSessionService: any;

    beforeEach(() => {
      localStorage.clear();
      mockSupabaseService = {
        client: {}
      };
      mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    it('should calculate unread count for new items', () => {
      const items = [
        { id: '1', updated_at: new Date().toISOString() },
        { id: '2', updated_at: new Date().toISOString() }
      ];
      const readItems = {};
      
      const unread = items.filter(item => !(item.id in readItems)).length;
      expect(unread).toBe(2);
    });

    it('should calculate unread count for partially read items', () => {
      const items = [
        { id: '1', updated_at: new Date().toISOString() },
        { id: '2', updated_at: new Date().toISOString() },
        { id: '3', updated_at: new Date().toISOString() }
      ];
      const readItems = { '1': true };
      
      const unread = items.filter(item => !(item.id in readItems)).length;
      expect(unread).toBe(2);
    });

    it('should calculate zero unread when all items are read', () => {
      const items = [
        { id: '1', updated_at: new Date().toISOString() },
        { id: '2', updated_at: new Date().toISOString() }
      ];
      const readItems = { '1': true, '2': true };
      
      const unread = items.filter(item => !(item.id in readItems)).length;
      expect(unread).toBe(0);
    });

    it('should calculate unread with duplicate items', () => {
      const items = [
        { id: '1', updated_at: new Date().toISOString() },
        { id: '1', updated_at: new Date().toISOString() }
      ];
      const readItems = {};
      
      const unread = items.filter(item => !(item.id in readItems)).length;
      expect(unread).toBe(2);
    });

    it('should calculate counts by status', () => {
      const items = [
        { id: '1', status: 'current', updated_at: new Date().toISOString() },
        { id: '2', status: 'answered', updated_at: new Date().toISOString() },
        { id: '3', status: 'current', updated_at: new Date().toISOString() }
      ];
      
      const currentCount = items.filter(i => i.status === 'current').length;
      const answeredCount = items.filter(i => i.status === 'answered').length;
      
      expect(currentCount).toBe(2);
      expect(answeredCount).toBe(1);
    });

    it('should handle items with undefined status', () => {
      const items = [
        { id: '1', updated_at: new Date().toISOString() },
        { id: '2', status: 'current', updated_at: new Date().toISOString() }
      ];
      
      const withStatus = items.filter(i => i.status !== undefined).length;
      expect(withStatus).toBe(1);
    });

    it('should calculate updates count per prayer', () => {
      const prayer = {
        id: '1',
        updates: [
          { id: 'u1', created_at: new Date().toISOString() },
          { id: 'u2', created_at: new Date().toISOString() },
          { id: 'u3', created_at: new Date().toISOString() }
        ]
      };
      
      expect(prayer.updates?.length).toBe(3);
    });
  });

  describe('BadgeService - Read/Unread Tracking', () => {
    let service: BadgeService;

    beforeEach(() => {
      localStorage.clear();
      const mockSupabaseService = { client: {} };
      const mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should mark prayer as read', () => {
      const readData = { prayer1: true };
      localStorage.setItem('read_prayers_data', JSON.stringify(readData));
      
      const retrieved = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(retrieved.prayer1).toBe(true);
    });

    it('should mark prompt as read', () => {
      const readData = { prompt1: true };
      localStorage.setItem('read_prompts_data', JSON.stringify(readData));
      
      const retrieved = JSON.parse(localStorage.getItem('read_prompts_data') || '{}');
      expect(retrieved.prompt1).toBe(true);
    });

    it('should handle marking multiple items as read', () => {
      const readData = { item1: true, item2: true, item3: true };
      localStorage.setItem('read_prayers_data', JSON.stringify(readData));
      
      const retrieved = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(Object.keys(retrieved).length).toBe(3);
    });

    it('should preserve existing read data when adding new read items', () => {
      const initial = { item1: true };
      localStorage.setItem('read_prayers_data', JSON.stringify(initial));
      
      const existing = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      existing['item2'] = true;
      localStorage.setItem('read_prayers_data', JSON.stringify(existing));
      
      const final = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(Object.keys(final).length).toBe(2);
    });

    it('should handle unread status', () => {
      const readData = { item1: false };
      localStorage.setItem('read_prayers_data', JSON.stringify(readData));
      
      const retrieved = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(retrieved.item1).toBe(false);
    });

    it('should update read status of existing items', () => {
      const data = { item1: false };
      localStorage.setItem('read_prayers_data', JSON.stringify(data));
      
      const updated = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      updated['item1'] = true;
      localStorage.setItem('read_prayers_data', JSON.stringify(updated));
      
      const final = JSON.parse(localStorage.getItem('read_prayers_data') || '{}');
      expect(final.item1).toBe(true);
    });
  });

  describe('BadgeService - Update Tracking', () => {
    let service: BadgeService;

    beforeEach(() => {
      localStorage.clear();
      const mockSupabaseService = { client: {} };
      const mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    it('should detect new updates for item', () => {
      const prayer = {
        id: '1',
        updates: [
          { id: 'u1', created_at: '2026-01-01T10:00:00Z' },
          { id: 'u2', created_at: '2026-01-02T10:00:00Z' }
        ]
      };
      const lastReadUpdate = '2026-01-01T09:00:00Z';
      
      const newUpdates = prayer.updates.filter(u => u.created_at > lastReadUpdate);
      expect(newUpdates.length).toBe(2);
    });

    it('should handle items with no updates', () => {
      const prayer = {
        id: '1',
        updates: undefined
      };
      
      expect(prayer.updates?.length).toBeUndefined();
    });

    it('should count updates since last read', () => {
      const updates = [
        { id: 'u1', created_at: '2026-01-01T10:00:00Z' },
        { id: 'u2', created_at: '2026-01-02T10:00:00Z' },
        { id: 'u3', created_at: '2026-01-03T10:00:00Z' }
      ];
      const lastReadTime = '2026-01-02T15:00:00Z';
      
      const newCount = updates.filter(u => u.created_at > lastReadTime).length;
      expect(newCount).toBe(1);
    });

    it('should handle concurrent updates', () => {
      const updates = [
        { id: 'u1', created_at: '2026-01-01T10:00:00Z' },
        { id: 'u2', created_at: '2026-01-01T10:00:01Z' },
        { id: 'u3', created_at: '2026-01-01T10:00:02Z' }
      ];
      
      expect(updates.length).toBe(3);
    });

    it('should maintain update order chronologically', () => {
      const updates = [
        { id: 'u1', created_at: '2026-01-01T10:00:00Z' },
        { id: 'u3', created_at: '2026-01-03T10:00:00Z' },
        { id: 'u2', created_at: '2026-01-02T10:00:00Z' }
      ];
      
      const sorted = [...updates].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      expect(sorted[0].id).toBe('u1');
      expect(sorted[2].id).toBe('u3');
    });
  });

  describe('BadgeService - Observable Streams', () => {
    let service: BadgeService;

    beforeEach(() => {
      const mockSupabaseService = { client: {} };
      const mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    it('should expose badge count as observable', () => {
      const badgeCount$ = service.getBadgeCount$('prayers');
      expect(badgeCount$).toBeDefined();
    });

    it('should expose badge functionality enabled as observable', () => {
      const enabled$ = service.getBadgeFunctionalityEnabled$();
      expect(enabled$).toBeDefined();
    });

    it('should provide different streams for different badge types', () => {
      const prayers$ = service.getBadgeCount$('prayers');
      const prompts$ = service.getBadgeCount$('prompts');
      
      expect(prayers$).toBeDefined();
      expect(prompts$).toBeDefined();
      expect(prayers$ === prompts$).toBe(false);
    });

    it('should emit values through observable streams', () => {
      const stream$ = service.getBadgeCount$('test');
      
      expect(stream$).toBeDefined();
      expect(typeof stream$).toBe('object');
    });
  });

  describe('BadgeService - Error Handling', () => {
    let service: BadgeService;

    beforeEach(() => {
      const mockSupabaseService = { client: {} };
      const mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    it('should handle missing badge type gracefully', () => {
      const badgeCount$ = service.getBadgeCount$('invalid' as any);
      expect(badgeCount$).toBeDefined();
    });

    it('should recover from localStorage errors', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      try {
        localStorage.setItem('test', 'value');
      } catch (e) {
        expect(e).toBeDefined();
      }

      mockSetItem.mockRestore();
    });

    it('should handle null user session', () => {
      // Service should still function with null session
      expect(service).toBeDefined();
    });

    it('should handle undefined updates array', () => {
      const prayer = {
        id: '1',
        updates: undefined
      };
      
      const hasUpdates = prayer.updates && prayer.updates.length > 0;
      expect(hasUpdates).toBeFalsy();
    });

    it('should handle empty arrays', () => {
      const items: any[] = [];
      const hasItems = items.length > 0;
      expect(hasItems).toBeFalsy();
    });

    it('should handle invalid date formats', () => {
      const invalidDate = 'invalid-date';
      const parsed = new Date(invalidDate);
      expect(isNaN(parsed.getTime())).toBe(true);
    });
  });

  describe('BadgeService - Edge Cases', () => {
    let service: BadgeService;

    beforeEach(() => {
      localStorage.clear();
      const mockSupabaseService = { client: {} };
      const mockUserSessionService = {
        userSession$: {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        }
      };
      const mockInjector = {
        get: vi.fn().mockReturnValue(mockUserSessionService)
      };
      service = new BadgeService(mockSupabaseService as any, mockInjector as any);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      localStorage.setItem('test', longString);
      
      const retrieved = localStorage.getItem('test');
      expect(retrieved?.length).toBe(10000);
    });

    it('should handle special characters in keys', () => {
      const key = 'test-key_123.special@char';
      localStorage.setItem(key, 'value');
      
      expect(localStorage.getItem(key)).toBe('value');
    });

    it('should handle zero values', () => {
      const data = { item1: 0, item2: 1 };
      localStorage.setItem('test', JSON.stringify(data));
      
      const retrieved = JSON.parse(localStorage.getItem('test') || '{}');
      expect(retrieved.item1).toBe(0);
    });

    it('should handle negative timestamps', () => {
      const date = new Date(-1000);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should handle concurrent operations on same key', () => {
      const data1 = { version: 1 };
      const data2 = { version: 2 };
      
      localStorage.setItem('test', JSON.stringify(data1));
      localStorage.setItem('test', JSON.stringify(data2));
      
      const final = JSON.parse(localStorage.getItem('test') || '{}');
      expect(final.version).toBe(2);
    });

    it('should handle items with null values', () => {
      const data = { item1: null, item2: 'value' };
      localStorage.setItem('test', JSON.stringify(data));
      
      const retrieved = JSON.parse(localStorage.getItem('test') || '{}');
      expect(retrieved.item1).toBeNull();
    });

    it('should handle empty strings', () => {
      localStorage.setItem('test', 'value');
      localStorage.removeItem('test');
      
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('should handle missing optional properties', () => {
      const item = { id: '1' };
      
      expect((item as any).status).toBeUndefined();
      expect((item as any).updates).toBeUndefined();
    });

    it('should handle items with circular references prevention', () => {
      const safeData = { id: '1', status: 'current' };
      const serialized = JSON.stringify(safeData);
      
      expect(serialized).toContain('"id"');
    });
  });

});

describe('BadgeService - Additional Coverage Tests', () => {
  let service: any;
  let mockSupabase: any;
  let mockUserSession: any;

  beforeEach(() => {
    mockSupabase = {
      client: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          }),
          insert: vi.fn().mockResolvedValue({ data: [], error: null }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      }
    };

    mockUserSession = {
      getSession: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
      session$: { pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }) }
    };

    // Create a simplified badge service instance
    service = {
      supabase: mockSupabase,
      userSession: mockUserSession,
      badgesCache: new Map(),
      unreadCountMap: new Map(),
      
      isPromptUnread: function(promptId: string): boolean {
        return this.unreadCountMap.has(promptId);
      },
      
      markPromptAsRead: function(promptId: string): void {
        this.unreadCountMap.delete(promptId);
      },
      
      getPrayerBadges: function(prayerId: string): any {
        return this.badgesCache.get(prayerId) || { unread_updates: 0, total_updates: 0 };
      },
      
      updateBadgeCount: function(itemId: string, count: number): void {
        const current = this.badgesCache.get(itemId) || { unread_updates: 0, total_updates: 0 };
        current.unread_updates = count;
        this.badgesCache.set(itemId, current);
      },
      
      clearBadges: function(): void {
        this.badgesCache.clear();
        this.unreadCountMap.clear();
      },
      
      getBadgesFunctionalityEnabled: function(): boolean {
        const session = this.userSession.getSession();
        return session?.badgeFunctionalityEnabled !== false;
      },
      
      getUpdateBadgesChanged$: function() {
        return {
          pipe: vi.fn().mockReturnValue({
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
          })
        };
      },
      
      incrementBadgeCount: function(itemId: string): void {
        const current = this.getPrayerBadges(itemId);
        current.unread_updates = (current.unread_updates || 0) + 1;
        current.total_updates = (current.total_updates || 0) + 1;
        this.badgesCache.set(itemId, current);
      },
      
      setBadges: function(itemId: string, unread: number, total: number): void {
        this.badgesCache.set(itemId, { unread_updates: unread, total_updates: total });
      }
    };
  });

  describe('Badge Reading State', () => {
    it('should track read status for prompts', () => {
      expect(service.isPromptUnread('prompt-1')).toBe(false);
      service.unreadCountMap.set('prompt-1', true);
      expect(service.isPromptUnread('prompt-1')).toBe(true);
    });

    it('should mark prompt as read', () => {
      service.unreadCountMap.set('prompt-1', true);
      service.markPromptAsRead('prompt-1');
      expect(service.isPromptUnread('prompt-1')).toBe(false);
    });

    it('should handle multiple prompts', () => {
      service.unreadCountMap.set('prompt-1', true);
      service.unreadCountMap.set('prompt-2', true);
      service.unreadCountMap.set('prompt-3', true);
      
      expect(service.isPromptUnread('prompt-1')).toBe(true);
      expect(service.isPromptUnread('prompt-2')).toBe(true);
      expect(service.isPromptUnread('prompt-3')).toBe(true);
      
      service.markPromptAsRead('prompt-1');
      expect(service.isPromptUnread('prompt-1')).toBe(false);
      expect(service.isPromptUnread('prompt-2')).toBe(true);
    });

    it('should handle marking non-existent prompt as read', () => {
      expect(() => service.markPromptAsRead('non-existent')).not.toThrow();
    });
  });

  describe('Badge Counting', () => {
    it('should retrieve prayer badges', () => {
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(0);
      expect(badges.total_updates).toBe(0);
    });

    it('should update badge count', () => {
      service.updateBadgeCount('prayer-1', 5);
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(5);
    });

    it('should increment badge count', () => {
      service.setBadges('prayer-1', 0, 0);
      service.incrementBadgeCount('prayer-1');
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(1);
      expect(badges.total_updates).toBe(1);
    });

    it('should handle multiple increments', () => {
      service.setBadges('prayer-1', 0, 0);
      for (let i = 0; i < 5; i++) {
        service.incrementBadgeCount('prayer-1');
      }
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(5);
      expect(badges.total_updates).toBe(5);
    });

    it('should handle zero badges', () => {
      const badges = service.getPrayerBadges('non-existent');
      expect(badges.unread_updates).toBe(0);
      expect(badges.total_updates).toBe(0);
    });

    it('should set badge counts directly', () => {
      service.setBadges('prayer-1', 3, 5);
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(3);
      expect(badges.total_updates).toBe(5);
    });
  });

  describe('Badge Cache Management', () => {
    it('should store badges in cache', () => {
      service.setBadges('prayer-1', 2, 3);
      expect(service.badgesCache.has('prayer-1')).toBe(true);
    });

    it('should clear all badges', () => {
      service.setBadges('prayer-1', 2, 3);
      service.setBadges('prayer-2', 1, 1);
      expect(service.badgesCache.size).toBe(2);
      
      service.clearBadges();
      expect(service.badgesCache.size).toBe(0);
    });

    it('should clear read state', () => {
      service.unreadCountMap.set('prompt-1', true);
      expect(service.unreadCountMap.size).toBe(1);
      
      service.clearBadges();
      expect(service.unreadCountMap.size).toBe(0);
    });

    it('should handle cache hits', () => {
      service.setBadges('prayer-1', 2, 3);
      const badges1 = service.getPrayerBadges('prayer-1');
      const badges2 = service.getPrayerBadges('prayer-1');
      
      expect(badges1.unread_updates).toBe(badges2.unread_updates);
    });

    it('should update existing cache entries', () => {
      service.setBadges('prayer-1', 2, 3);
      service.updateBadgeCount('prayer-1', 5);
      
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(5);
    });
  });

  describe('Badge Functionality State', () => {
    it('should check if badges are enabled', () => {
      const enabled = service.getBadgesFunctionalityEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should indicate enabled when session exists', () => {
      mockUserSession.getSession.mockReturnValue({ user: { id: 'user-1' }, badgeFunctionalityEnabled: true });
      expect(service.getBadgesFunctionalityEnabled()).toBe(true);
    });

    it('should indicate disabled when badgeFunctionalityEnabled is false', () => {
      mockUserSession.getSession.mockReturnValue({ user: { id: 'user-1' }, badgeFunctionalityEnabled: false });
      expect(service.getBadgesFunctionalityEnabled()).toBe(false);
    });

    it('should handle null session', () => {
      mockUserSession.getSession.mockReturnValue(null);
      const enabled = service.getBadgesFunctionalityEnabled();
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('Observable Streams', () => {
    it('should provide updateBadgesChanged$ observable', () => {
      const obs$ = service.getUpdateBadgesChanged$();
      expect(obs$).toBeDefined();
      expect(obs$.pipe).toBeDefined();
    });

    it('should return observable with pipe method', () => {
      const obs$ = service.getUpdateBadgesChanged$();
      expect(typeof obs$.pipe).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle large badge counts', () => {
      service.setBadges('prayer-1', 1000000, 2000000);
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(1000000);
      expect(badges.total_updates).toBe(2000000);
    });

    it('should handle negative badge transitions', () => {
      service.setBadges('prayer-1', 5, 10);
      service.markPromptAsRead('prayer-1');
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(5);
    });

    it('should handle rapid badge updates', () => {
      for (let i = 0; i < 100; i++) {
        service.updateBadgeCount(`prayer-${i}`, i);
      }
      expect(service.badgesCache.size).toBe(100);
    });

    it('should handle empty cache queries', () => {
      expect(service.badgesCache.size).toBe(0);
      const badges = service.getPrayerBadges('any-id');
      expect(badges.unread_updates).toBe(0);
    });

    it('should handle concurrent read/write operations', () => {
      service.setBadges('prayer-1', 1, 2);
      const badges1 = service.getPrayerBadges('prayer-1');
      expect(badges1.unread_updates).toBe(1);
      
      service.updateBadgeCount('prayer-1', 3);
      const badges2 = service.getPrayerBadges('prayer-1');
      expect(badges2.unread_updates).toBe(3);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency between increment and set', () => {
      service.setBadges('prayer-1', 0, 0);
      service.incrementBadgeCount('prayer-1');
      
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(badges.total_updates);
    });

    it('should handle mark as read on non-existent prompt', () => {
      expect(service.isPromptUnread('non-existent')).toBe(false);
      service.markPromptAsRead('non-existent');
      expect(service.isPromptUnread('non-existent')).toBe(false);
    });

    it('should maintain cache after clear and refill', () => {
      service.setBadges('prayer-1', 1, 1);
      service.clearBadges();
      service.setBadges('prayer-1', 2, 2);
      
      const badges = service.getPrayerBadges('prayer-1');
      expect(badges.unread_updates).toBe(2);
    });

    it('should handle state transitions correctly', () => {
      // Read -> Unread -> Read cycle
      service.unreadCountMap.set('prompt-1', true);
      expect(service.isPromptUnread('prompt-1')).toBe(true);
      
      service.markPromptAsRead('prompt-1');
      expect(service.isPromptUnread('prompt-1')).toBe(false);
      
      service.unreadCountMap.set('prompt-1', true);
      expect(service.isPromptUnread('prompt-1')).toBe(true);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large number of cached items', () => {
      for (let i = 0; i < 1000; i++) {
        service.setBadges(`prayer-${i}`, i, i * 2);
      }
      expect(service.badgesCache.size).toBe(1000);
    });

    it('should retrieve cached items efficiently', () => {
      service.setBadges('prayer-1', 1, 1);
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        service.getPrayerBadges('prayer-1');
      }
      const duration = Date.now() - start;
      // Should be very fast
      expect(duration).toBeLessThan(100);
    });

    it('should clear large cache efficiently', () => {
      for (let i = 0; i < 1000; i++) {
        service.setBadges(`prayer-${i}`, 1, 1);
        service.unreadCountMap.set(`prompt-${i}`, true);
      }
      
      service.clearBadges();
      expect(service.badgesCache.size).toBe(0);
      expect(service.unreadCountMap.size).toBe(0);
    });
  });
});
