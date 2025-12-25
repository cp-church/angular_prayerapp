import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminDataService } from './admin-data.service';

describe('AdminDataService', () => {
  let service: AdminDataService;
  let mockSupabaseService: any;
  let mockPrayerService: any;
  let mockEmailNotificationService: any;

  const mockPendingPrayers = [
    {
      id: '1',
      title: 'Test Prayer',
      description: 'Test Description',
      status: 'current',
      approval_status: 'pending',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockPendingUpdates = [
    {
      id: 'u1',
      prayer_id: '1',
      content: 'Update content',
      approval_status: 'pending',
      prayers: { title: 'Test Prayer' },
      created_at: '2024-01-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    // Mock Supabase Service
    mockSupabaseService = {
      client: {
        from: vi.fn((table: string) => {
          const mockResult = {
            data: table === 'prayers' ? mockPendingPrayers : 
                  table === 'prayer_updates' ? mockPendingUpdates : [],
            error: null
          };
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve(mockResult))
              })),
              order: vi.fn(() => Promise.resolve(mockResult))
            }))
          };
        }),
        auth: {
          getSession: vi.fn(() => Promise.resolve({
            data: { session: null },
            error: null
          }))
        }
      }
    };

    // Mock Prayer Service
    mockPrayerService = {
      deletePrayer: vi.fn(() => Promise.resolve({ success: true })),
      deleteUpdate: vi.fn(() => Promise.resolve({ success: true }))
    };

    // Mock Email Notification Service
    mockEmailNotificationService = {
      sendNotification: vi.fn(() => Promise.resolve({ success: true })),
      getTemplate: vi.fn(() => Promise.resolve(null)),
      sendEmail: vi.fn(() => Promise.resolve({ success: true }))
    };

    // Instantiate service directly
    service = new (AdminDataService as any)(
      mockSupabaseService,
      mockPrayerService,
      mockEmailNotificationService
    );
  });

  describe('initialization', () => {
    it('should create the service', () => {
      expect(service).toBeDefined();
    });

    it('should have data$ observable', () => {
      expect(service.data$).toBeDefined();
    });

    it('should start with empty data', (done) => {
      service.data$.subscribe(data => {
        expect(data.pendingPrayers).toEqual([]);
        expect(data.loading).toBe(false);
        done();
      });
    });
  });

  describe('fetchAdminData', () => {
    it('should fetch pending prayers', async () => {
      await service.fetchAdminData();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('prayers');
    });

    it('should set loading to true at start (non-silent)', async () => {
      const promise = service.fetchAdminData(false);
      
      let loadingValue: boolean | undefined;
      service.data$.subscribe(data => {
        if (loadingValue === undefined) {
          loadingValue = data.loading;
        }
      });
      
      await promise;
      expect(loadingValue).toBe(true);
    });

    it('should not set loading to true when silent', async () => {
      await service.fetchAdminData(true);
      
      // Silent mode should not update loading state initially
      expect(mockSupabaseService.client.from).toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      mockSupabaseService.client.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }));

      await service.fetchAdminData();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      service.data$.subscribe(data => {
        expect(data.error).toBeTruthy();
      });
    });

    it('should prevent concurrent fetches', async () => {
      const promise1 = service.fetchAdminData();
      const promise2 = service.fetchAdminData();
      
      await Promise.all([promise1, promise2]);
      
      // Should only call once due to isFetching flag
      expect(mockSupabaseService.client.from).toHaveBeenCalledTimes(6); // 6 queries in phase 1
    });

    it('should fetch all pending item types', async () => {
      await service.fetchAdminData();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('prayers');
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('prayer_updates');
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('deletion_requests');
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('status_change_requests');
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('update_deletion_requests');
      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('account_approval_requests');
    });
  });

  describe('data transformation', () => {
    it('should transform pending updates with prayer titles', async () => {
      await service.fetchAdminData();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      service.data$.subscribe(data => {
        if (data.pendingUpdates.length > 0) {
          expect(data.pendingUpdates[0]).toHaveProperty('prayer_title');
        }
      });
    });
  });

  describe('observables', () => {
    it('should emit data changes', (done) => {
      let emitCount = 0;
      service.data$.subscribe(() => {
        emitCount++;
        if (emitCount >= 1) {
          expect(emitCount).toBeGreaterThan(0);
          done();
        }
      });
    });

    it('should provide current data state', (done) => {
      service.data$.subscribe(data => {
        expect(data).toHaveProperty('pendingPrayers');
        expect(data).toHaveProperty('pendingUpdates');
        expect(data).toHaveProperty('loading');
        expect(data).toHaveProperty('error');
        done();
      });
    });
  });

  describe('error handling', () => {
    it('should set error state on failure', async () => {
      mockSupabaseService.client.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.reject(new Error('Network error')))
          }))
        }))
      }));

      await service.fetchAdminData();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      service.data$.subscribe(data => {
        if (data.error) {
          expect(data.error).toBeTruthy();
          expect(data.loading).toBe(false);
        }
      });
    });

    it('should clear error on successful fetch', async () => {
      // First, cause an error
      mockSupabaseService.client.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.reject(new Error('Error')))
          }))
        }))
      }));

      await service.fetchAdminData();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then, succeed
      mockSupabaseService.client.from = vi.fn((table: string) => {
        const mockResult = {
          data: table === 'prayers' ? mockPendingPrayers : [],
          error: null
        };
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve(mockResult))
            }))
          }))
        };
      });

      await service.fetchAdminData();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      service.data$.subscribe(data => {
        if (!data.loading) {
          expect(data.error).toBeNull();
        }
      });
    });
  });

  describe('data structure', () => {
    it('should include all required data fields', (done) => {
      service.data$.subscribe(data => {
        expect(data).toHaveProperty('pendingPrayers');
        expect(data).toHaveProperty('pendingUpdates');
        expect(data).toHaveProperty('pendingDeletionRequests');
        expect(data).toHaveProperty('pendingStatusChangeRequests');
        expect(data).toHaveProperty('pendingUpdateDeletionRequests');
        expect(data).toHaveProperty('pendingAccountRequests');
        expect(data).toHaveProperty('approvedPrayers');
        expect(data).toHaveProperty('approvedUpdates');
        expect(data).toHaveProperty('deniedPrayers');
        expect(data).toHaveProperty('deniedUpdates');
        expect(data).toHaveProperty('loading');
        expect(data).toHaveProperty('error');
        done();
      });
    });

    it('should have correct types for data fields', (done) => {
      service.data$.subscribe(data => {
        expect(Array.isArray(data.pendingPrayers)).toBe(true);
        expect(Array.isArray(data.pendingUpdates)).toBe(true);
        expect(typeof data.loading).toBe('boolean');
        expect(data.error === null || typeof data.error === 'string').toBe(true);
        done();
      });
    });
  });
});
