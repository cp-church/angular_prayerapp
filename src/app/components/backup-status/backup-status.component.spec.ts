import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackupStatusComponent } from './backup-status.component';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

describe('BackupStatusComponent', () => {
  let component: BackupStatusComponent;
  let mockSupabaseService: any;
  let mockToastService: any;

  const mockBackupLog = {
    id: '123',
    backup_date: '2024-01-15T10:30:00Z',
    status: 'success' as const,
    tables_backed_up: {
      prayers: 10,
      prayer_updates: 5,
      email_subscribers: 3
    },
    total_records: 18,
    duration_seconds: 45,
    created_at: '2024-01-15T10:30:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabaseService = {
      getSupabaseUrl: vi.fn().mockReturnValue('https://test.supabase.co'),
      getSupabaseKey: vi.fn().mockReturnValue('test-key'),
      getClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({ error: null }),
          select: vi.fn().mockReturnValue({ eq: vi.fn() }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn(), in: vi.fn() }),
          upsert: vi.fn()
        })
      })
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    };

    component = new BackupStatusComponent(mockSupabaseService, mockToastService);
    
    global.fetch = vi.fn();
    global.confirm = vi.fn().mockReturnValue(true);
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.latestBackup).toBeNull();
      expect(component.allBackups).toEqual([]);
      expect(component.showFullLog).toBe(false);
      expect(component.expandedBackupId).toBeNull();
      expect(component.loading).toBe(false);
      expect(component.backingUp).toBe(false);
      expect(component.restoring).toBe(false);
      expect(component.showRestoreDialog).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call fetchBackupLogs', async () => {
      const spy = vi.spyOn(component, 'fetchBackupLogs').mockResolvedValue();
      await component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('fetchBackupLogs', () => {
    it('should fetch and set backup logs successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockBackupLog]
      });

      await component.fetchBackupLogs();

      expect(component.latestBackup).toEqual(mockBackupLog);
      expect(component.allBackups).toEqual([mockBackupLog]);
      expect(component.loading).toBe(false);
    });

    it('should handle fetch error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await component.fetchBackupLogs();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to load backup logs');
      expect(component.loading).toBe(false);
    });

    it('should handle non-ok response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      await component.fetchBackupLogs();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to load backup logs');
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => []
      });

      await component.fetchBackupLogs();

      expect(component.latestBackup).toBeNull();
      expect(component.allBackups).toEqual([]);
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const formatted = component.formatDate('2024-01-15T14:30:00Z');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(component.formatDuration(30)).toBe('30s');
      expect(component.formatDuration(59)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(component.formatDuration(60)).toBe('1m 0s');
      expect(component.formatDuration(90)).toBe('1m 30s');
      expect(component.formatDuration(125)).toBe('2m 5s');
    });

    it('should return N/A for undefined', () => {
      expect(component.formatDuration(undefined)).toBe('N/A');
    });
  });

  describe('toggleExpanded', () => {
    it('should expand backup', () => {
      component.toggleExpanded('123');
      expect(component.expandedBackupId).toBe('123');
    });

    it('should collapse expanded backup', () => {
      component.expandedBackupId = '123';
      component.toggleExpanded('123');
      expect(component.expandedBackupId).toBeNull();
    });
  });

  describe('toggleShowFullLog', () => {
    it('should toggle showFullLog', () => {
      expect(component.showFullLog).toBe(false);
      component.toggleShowFullLog();
      expect(component.showFullLog).toBe(true);
      component.toggleShowFullLog();
      expect(component.showFullLog).toBe(false);
    });

    it('should reset expandedBackupId when hiding full log', () => {
      component.showFullLog = true;
      component.expandedBackupId = '123';
      component.toggleShowFullLog();
      expect(component.expandedBackupId).toBeNull();
    });
  });

  describe('getTableEntries', () => {
    it('should return sorted table entries', () => {
      const backup = {
        ...mockBackupLog,
        tables_backed_up: {
          zebra: 5,
          apple: 10,
          banana: 3
        }
      };

      const entries = component.getTableEntries(backup);
      expect(entries).toEqual([
        ['apple', 10],
        ['banana', 3],
        ['zebra', 5]
      ]);
    });
  });

  describe('getVisibleBackups', () => {
    it('should return first 5 backups when showFullLog is false', () => {
      component.allBackups = Array.from({ length: 10 }, (_, i) => ({
        ...mockBackupLog,
        id: `backup-${i}`
      }));

      const visible = component.getVisibleBackups();
      expect(visible).toHaveLength(5);
    });

    it('should return all backups when showFullLog is true', () => {
      component.allBackups = Array.from({ length: 10 }, (_, i) => ({
        ...mockBackupLog,
        id: `backup-${i}`
      }));
      component.showFullLog = true;

      const visible = component.getVisibleBackups();
      expect(visible).toHaveLength(10);
    });
  });

  describe('handleManualBackup', () => {
    it('should not proceed if user cancels', async () => {
      (global.confirm as any).mockReturnValue(false);

      await component.handleManualBackup();
      
      expect(component.backingUp).toBe(false);
    });

    it('should create backup with fetched table list', async () => {
      const tableListResponse = {
        ok: true,
        json: async () => [
          { table_name: 'prayers' },
          { table_name: 'prayer_updates' }
        ]
      };

      const tableDataResponse = {
        ok: true,
        json: async () => [{ id: '1', title: 'Test' }]
      };

      (global.fetch as any)
        .mockResolvedValueOnce(tableListResponse)
        .mockResolvedValue(tableDataResponse);

      // Mock DOM methods
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: ''
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      await component.handleManualBackup();

      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.backingUp).toBe(false);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should use fallback table list if fetch fails', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValue({ ok: true, json: async () => [] });

      const mockLink = {
        click: vi.fn(),
        href: '',
        download: ''
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      await component.handleManualBackup();

      expect(component.backingUp).toBe(false);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle backup error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Backup failed'));

      await component.handleManualBackup();

      expect(mockToastService.error).toHaveBeenCalled();
      expect(component.backingUp).toBe(false);
    });
  });

  describe('handleManualRestore', () => {
    it('should not proceed if no file selected', async () => {
      const mockEvent = {
        target: {
          files: [],
          value: ''
        }
      } as any;

      await component.handleManualRestore(mockEvent);
      
      expect(component.restoring).toBe(false);
    });

    it('should not proceed if user cancels', async () => {
      (global.confirm as any).mockReturnValue(false);

      const mockFile = new File(['{}'], 'backup.json', { type: 'application/json' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'backup.json'
        }
      } as any;

      await component.handleManualRestore(mockEvent);
      
      expect(component.restoring).toBe(false);
      expect(mockEvent.target.value).toBe('');
    });

    it('should handle invalid backup format', async () => {
      const invalidData = { invalid: 'format' };
      const mockFile = new File([JSON.stringify(invalidData)], 'backup.json', { type: 'application/json' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'backup.json'
        }
      } as any;

        // Ensure the File polyfill used in the test environment has a text() method
        (mockFile as any).text = async () => JSON.stringify(invalidData);

        await component.handleManualRestore(mockEvent);

        expect(mockToastService.error).toHaveBeenCalledWith(expect.stringContaining('Invalid backup file format'));
        expect(component.restoring).toBe(false);
    });

    it('should restore from valid backup file', async () => {
      const backupData = {
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0',
        tables: {
          prayers: {
            count: 1,
            data: [{ id: '1', title: 'Test Prayer' }]
          }
        }
      };

      const mockFile = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'backup.json'
        }
      } as any;

      const mockSelect = vi.fn().mockReturnValue({ data: [], error: null });
      const mockDelete = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ error: null }) });
      const mockUpsert = vi.fn().mockReturnValue({ error: null });
      mockSupabaseService.getClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: mockSelect,
          delete: mockDelete,
          upsert: mockUpsert
        })
      });

      // Provide a safe mock for window.location.reload (some environments make it non-configurable)
      const originalLocation = window.location;
      try {
        // Replace location with a shallow copy that contains a reload spy
        delete (window as any).location;
      } catch (e) {
        // ignore
      }
      const reloadSpy = vi.fn();
      (window as any).location = { ...originalLocation, reload: reloadSpy } as any;

      await component.handleManualRestore(mockEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(component.restoring).toBe(false);

      // restore original location
      try {
        delete (window as any).location;
      } catch (e) {}
      (window as any).location = originalLocation;
    });

    it('should handle restore errors', async () => {
      const backupData = {
        timestamp: '2024-01-15T10:30:00Z',
        version: '1.0',
        tables: {
          prayers: {
            count: 1,
            data: [{ id: '1', title: 'Test' }]
          }
        }
      };

      const mockFile = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' });
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'backup.json'
        }
      } as any;

      mockSupabaseService.getClient.mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ data: null, error: new Error('DB Error') })
        })
      });

      // Provide a safe mock for window.location.reload (some environments make it non-configurable)
      const originalLocation2 = window.location;
      try {
        delete (window as any).location;
      } catch (e) {}
      const reloadSpy2 = vi.fn();
      (window as any).location = { ...originalLocation2, reload: reloadSpy2 } as any;

      await component.handleManualRestore(mockEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(component.restoring).toBe(false);

      // restore original location
      try {
        delete (window as any).location;
      } catch (e) {}
      (window as any).location = originalLocation2;
    });
  });
});
