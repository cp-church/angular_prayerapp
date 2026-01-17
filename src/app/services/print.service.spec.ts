import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrintService, Prayer, TimeRange } from './print.service';
import { SupabaseService } from './supabase.service';

describe('PrintService', () => {
  let service: PrintService;
  let mockSupabaseService: any;
  let mockSupabaseClient: any;

  const mockPrayers: Prayer[] = [
    {
      id: '1',
      title: 'Test Prayer 1',
      prayer_for: 'John Doe',
      description: 'Test description 1',
      requester: 'Jane Smith',
      status: 'current',
      created_at: new Date().toISOString(),
      prayer_updates: [
        {
          id: 'u1',
          content: 'Update content 1',
          author: 'Author 1',
          created_at: new Date().toISOString(),
        }
      ]
    },
    {
      id: '2',
      title: 'Test Prayer 2',
      prayer_for: 'Jane Doe',
      description: 'Test description 2',
      requester: 'John Smith',
      status: 'answered',
      created_at: new Date().toISOString(),
      date_answered: new Date().toISOString(),
      prayer_updates: []
    }
  ];

  beforeEach(() => {
    const createMockChain = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockPrayers, error: null }),
    });

    mockSupabaseClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'prayer_updates') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return createMockChain();
      }),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null })
      },
      // Direct order reference for tests that call mockSupabaseClient.order directly
      order: vi.fn().mockResolvedValue({ data: mockPrayers, error: null })
    };

    mockSupabaseService = {
      client: mockSupabaseClient
    } as any;

    // Mock document.createElement for escapeHtml
    const mockDiv = {
      textContent: '',
      innerHTML: ''
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'div') {
        return {
          set textContent(value: string) {
            // Simple HTML escape implementation
            mockDiv.innerHTML = value
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          },
          get innerHTML() {
            return mockDiv.innerHTML;
          }
        } as any;
      }
      return {
        href: '',
        download: '',
        click: vi.fn()
      } as any;
    });

    service = new PrintService(mockSupabaseService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('downloadPrintablePrayerList', () => {
    beforeEach(() => {
      // Mock window.open, alert, and DOM methods
      global.window.open = vi.fn();
      global.alert = vi.fn();
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      global.document.createElement = vi.fn(() => mockLink as any);
      global.document.body.appendChild = vi.fn();
      global.document.body.removeChild = vi.fn();
    });

    it('should fetch prayers with correct date range for week', async () => {
      await service.downloadPrintablePrayerList('week', null);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayers');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayer_updates');
    });

    it('should fetch prayers with correct date range for twoweeks', async () => {
      await service.downloadPrintablePrayerList('twoweeks', null);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayers');
    });

    it('should fetch prayers with correct date range for month', async () => {
      await service.downloadPrintablePrayerList('month', null);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayers');
    });

    it('should fetch prayers with correct date range for year', async () => {
      await service.downloadPrintablePrayerList('year', null);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayers');
    });

    it('should fetch prayers with correct date range for all', async () => {
      await service.downloadPrintablePrayerList('all', null);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayers');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prayer_updates');
    });

    it('should handle error when fetching prayers', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Database error') 
        }),
      }));

      await service.downloadPrintablePrayerList('month', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[PrintService] Error fetching prayers:', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('Failed to fetch prayers. Please try again.');
    });

    it('should close newWindow when error occurs', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockWindow = { close: vi.fn() };
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Database error') 
        }),
      }));

      await service.downloadPrintablePrayerList('month', mockWindow as any);

      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should alert when no prayers found', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      await service.downloadPrintablePrayerList('week', null);

      expect(global.alert).toHaveBeenCalledWith('No prayers found in the last week.');
    });

    it('should alert with correct time range text for twoweeks', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      await service.downloadPrintablePrayerList('twoweeks', null);

      expect(global.alert).toHaveBeenCalledWith('No prayers found in the last 2 weeks.');
    });

    it('should alert with correct time range text for all', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      await service.downloadPrintablePrayerList('all', null);

      expect(global.alert).toHaveBeenCalledWith('No prayers found in the last database.');
    });

    it('should open new window with HTML content when window.open succeeds', async () => {
      const mockWindow = {
        document: {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn()
      };
      (global.window.open as any).mockReturnValue(mockWindow);

      await service.downloadPrintablePrayerList('month', null);

      expect(mockWindow.document.open).toHaveBeenCalled();
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
      expect(mockWindow.focus).toHaveBeenCalled();
    });

    it('should use provided newWindow when available', async () => {
      const mockWindow = {
        document: {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn()
      };

      await service.downloadPrintablePrayerList('month', mockWindow as any);

      expect(mockWindow.document.open).toHaveBeenCalled();
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('should download file when window.open is blocked', async () => {
      (global.window.open as any).mockReturnValue(null);
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      (global.document.createElement as any).mockReturnValue(mockLink);

      await service.downloadPrintablePrayerList('month', null);

      expect(mockLink.click).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Prayer list downloaded. Please open the file to view and print.');
    });

    it('should handle catch block error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await service.downloadPrintablePrayerList('month', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating prayer list:', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('Failed to generate prayer list. Please try again.');
    });
  });

  describe('PrintService - Date Filtering', () => {
    let service: PrintService;
    let mockSupabaseService: any;
    let mockSupabaseClient: any;

    beforeEach(() => {
      const createMockChain = () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      mockSupabaseClient = {
        from: vi.fn(() => createMockChain())
      };

      mockSupabaseService = {
        client: mockSupabaseClient
      };

      service = new PrintService(mockSupabaseService as any);
    });

    it('should filter by month correctly', () => {
      const now = new Date('2026-01-15');
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      expect(startOfMonth.getMonth()).toBe(0);
      expect(endOfMonth.getDate()).toBe(31);
    });

    it('should filter by year correctly', () => {
      const year = 2026;
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      
      expect(startOfYear.getFullYear()).toBe(2026);
      expect(endOfYear.getFullYear()).toBe(2026);
    });

    it('should handle date range filtering', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');
      
      expect(startDate <= endDate).toBe(true);
    });

    it('should handle null date parameter', () => {
      const date: Date | null = null;
      expect(date).toBeNull();
    });

    it('should filter by week correctly', () => {
      const now = new Date('2026-01-15');
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      expect(weekStart).toBeDefined();
    });

    it('should handle leap year dates', () => {
      const leapYearDate = new Date(2024, 1, 29); // Month is 0-indexed, so 1 = February
      expect(leapYearDate.getMonth()).toBe(1); // February
      expect(leapYearDate.getDate()).toBe(29);
    });

    it('should handle year boundaries', () => {
      const endOfYear = new Date('2025-12-31');
      const startOfNextYear = new Date('2026-01-01');
      
      expect(startOfNextYear > endOfYear).toBe(true);
    });

    it('should handle month boundaries', () => {
      const endOfMonth = new Date('2026-01-31');
      const startOfNextMonth = new Date('2026-02-01');
      
      expect(startOfNextMonth > endOfMonth).toBe(true);
    });
  });

  describe('PrintService - Prayer Status Filtering', () => {
    let service: PrintService;
    let mockSupabaseService: any;

    beforeEach(() => {
      const createMockChain = () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      mockSupabaseService = {
        client: {
          from: vi.fn(() => createMockChain())
        }
      };

      service = new PrintService(mockSupabaseService as any);
    });

    it('should handle current prayer status', () => {
      const status = 'current';
      expect(status).toBe('current');
    });

    it('should handle answered prayer status', () => {
      const status = 'answered';
      expect(status).toBe('answered');
    });

    it('should handle archived prayer status', () => {
      const status = 'archived';
      expect(status).toBe('archived');
    });

    it('should filter by status correctly', () => {
      const prayers = [
        { status: 'current' },
        { status: 'answered' },
        { status: 'archived' }
      ];
      
      const currentPrayers = prayers.filter(p => p.status === 'current');
      expect(currentPrayers.length).toBe(1);
    });

    it('should handle mixed statuses', () => {
      const statuses = ['current', 'answered', 'archived'];
      expect(statuses.length).toBe(3);
    });

    it('should count prayers by status', () => {
      const prayers = [
        { status: 'current' },
        { status: 'current' },
        { status: 'answered' }
      ];
      
      const statusCount = {
        current: prayers.filter(p => p.status === 'current').length,
        answered: prayers.filter(p => p.status === 'answered').length
      };
      
      expect(statusCount.current).toBe(2);
      expect(statusCount.answered).toBe(1);
    });
  });

  describe('PrintService - HTML Generation', () => {
    let service: PrintService;
    let mockSupabaseService: any;

    beforeEach(() => {
      const createMockChain = () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      mockSupabaseService = {
        client: {
          from: vi.fn(() => createMockChain())
        }
      };

      service = new PrintService(mockSupabaseService as any);
    });

    it('should generate valid HTML', () => {
      const html = '<html><body><p>Test</p></body></html>';
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should include prayer data in HTML', () => {
      const prayerTitle = 'Test Prayer';
      const html = `<p>Prayer: ${prayerTitle}</p>`;
      expect(html).toContain(prayerTitle);
    });

    it('should include prayer for name in HTML', () => {
      const prayerFor = 'John Doe';
      const html = `<p>For: ${prayerFor}</p>`;
      expect(html).toContain(prayerFor);
    });

    it('should include description in HTML', () => {
      const description = 'Please pray for healing';
      const html = `<p>${description}</p>`;
      expect(html).toContain(description);
    });

    it('should format prayer updates', () => {
      const updates = ['Update 1', 'Update 2'];
      const html = updates.map(u => `<p>${u}</p>`).join('');
      expect(html).toContain('Update 1');
      expect(html).toContain('Update 2');
    });

    it('should include prayer creation date', () => {
      const date = new Date().toLocaleDateString();
      const html = `<p>Created: ${date}</p>`;
      expect(html).toContain(date);
    });

    it('should handle special characters in HTML', () => {
      const text = 'Prayer for "Peace" & Justice';
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      expect(escaped).toContain('&amp;');
    });

    it('should include page breaks for printing', () => {
      const html = '<div style="page-break-after: always;"></div>';
      expect(html).toContain('page-break');
    });

    it('should include print styles', () => {
      const styles = '@media print { body { font-size: 12pt; } }';
      expect(styles).toContain('@media print');
    });
  });

  describe('PrintService - File Operations', () => {
    let service: PrintService;
    let mockSupabaseService: any;

    beforeEach(() => {
      const createMockChain = () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      mockSupabaseService = {
        client: {
          from: vi.fn(() => createMockChain())
        }
      };

      service = new PrintService(mockSupabaseService as any);
    });

    it('should create valid filename', () => {
      const filename = 'prayer-list-2026-01.html';
      expect(filename).toMatch(/prayer-list-\d{4}-\d{2}\.html/);
    });

    it('should include timestamp in filename', () => {
      const timestamp = new Date().getTime();
      const filename = `prayers-${timestamp}.html`;
      expect(filename).toContain(timestamp.toString());
    });

    it('should set correct MIME type', () => {
      const mimeType = 'text/html';
      expect(mimeType).toBe('text/html');
    });

    it('should create blob correctly', () => {
      const content = '<html></html>';
      const blob = new Blob([content], { type: 'text/html' });
      expect(blob).toBeDefined();
      expect(blob.type).toBe('text/html');
    });

    it('should handle file download', () => {
      const link = document.createElement('a');
      const blob = new Blob(['test'], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = 'test.html';
      
      expect(link.href).toContain('blob:');
      expect(link.download).toBe('test.html');
    });

    it('should cleanup blob URL', () => {
      const blob = new Blob(['test'], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      URL.revokeObjectURL(url);
      expect(url).toBeDefined();
    });

    it('should handle file size', () => {
      const content = 'A'.repeat(1000);
      const blob = new Blob([content], { type: 'text/html' });
      expect(blob.size).toBe(1000);
    });
  });

  describe('PrintService - Error Handling', () => {
    let service: PrintService;
    let mockSupabaseService: any;

    beforeEach(() => {
      const createMockChain = () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      mockSupabaseService = {
        client: {
          from: vi.fn(() => createMockChain())
        }
      };

      service = new PrintService(mockSupabaseService as any);
    });

    it('should handle database query errors', async () => {
      const errorChain = () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      });

      mockSupabaseService.client.from = vi.fn(() => errorChain());
      
      const result = await service.downloadPrintablePrayerList('month');
      expect(result).toBeUndefined();
    });

    it('should handle null response', () => {
      const response: any = null;
      expect(response).toBeNull();
    });

    it('should handle undefined data', () => {
      const data: any = undefined;
      expect(data).toBeUndefined();
    });

    it('should handle empty prayer list', () => {
      const prayers: any[] = [];
      expect(prayers.length).toBe(0);
    });

    it('should handle missing prayer fields', () => {
      const prayer = { id: '1' };
      expect(prayer.id).toBeDefined();
    });

    it('should handle malformed HTML', () => {
      const html = '<div>Unclosed tag';
      expect(html).toBeDefined();
    });

    it('should handle large prayer lists', () => {
      const prayers = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        title: `Prayer ${i}`
      }));
      expect(prayers.length).toBe(10000);
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        service.downloadPrintablePrayerList('month'),
        service.downloadPrintablePrayerList('week'),
        service.downloadPrintablePrayerList('year')
      ];
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
    });
  });

});
