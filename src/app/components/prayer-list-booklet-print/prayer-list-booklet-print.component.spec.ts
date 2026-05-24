import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';
import { PrayerListBookletPrintComponent } from './prayer-list-booklet-print.component';
import { PrintService } from '../../services/print.service';
import { SupabaseService } from '../../services/supabase.service';

describe('PrayerListBookletPrintComponent', () => {
  let mockPrint: { downloadPrintableBookletPrayerList: ReturnType<typeof vi.fn> };
  let mockSupabase: { client: { from: ReturnType<typeof vi.fn> } };
  let mockCdr: { markForCheck: ReturnType<typeof vi.fn> };
  let originalOpen: typeof window.open;
  let capHolder: { Capacitor?: unknown };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrint = {
      downloadPrintableBookletPrayerList: vi.fn().mockResolvedValue(undefined),
    };
    mockSupabase = {
      client: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'new-id',
                  sort_order: 0,
                  label: 'test.png',
                  mime_type: 'image/png',
                  image_data: 'data:image/png;base64,xx',
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      },
    };
    mockCdr = {
      markForCheck: vi.fn(),
    };
    originalOpen = window.open;
    capHolder = window as unknown as { Capacitor?: unknown };
    delete capHolder.Capacitor;
    window.open = vi.fn().mockReturnValue({ close: vi.fn() });
  });

  afterEach(() => {
    window.open = originalOpen;
    delete capHolder.Capacitor;
    vi.restoreAllMocks();
  });

  function createComponent(): PrayerListBookletPrintComponent {
    return new PrayerListBookletPrintComponent(
      mockPrint as unknown as PrintService,
      mockSupabase as unknown as SupabaseService,
      mockCdr as unknown as ChangeDetectorRef
    );
  }

  it('should create', () => {
    expect(createComponent()).toBeTruthy();
  });

  describe('onSectionToggle', () => {
    it('loads insert pages on first expand', async () => {
      const c = createComponent();
      c.onSectionToggle();
      await vi.waitFor(() => {
        expect(mockSupabase.client.from).toHaveBeenCalledWith('booklet_insert_pages');
        expect(c.insertPagesLoading).toBe(false);
      });
    });
  });

  describe('onInsertPageDrop', () => {
    it('updates sort_order after reorder', async () => {
      const c = createComponent();
      c.insertPages = [
        { id: 'a', sort_order: 0, label: 'A', mime_type: 'image/png', image_data: 'data:1' },
        { id: 'b', sort_order: 1, label: 'B', mime_type: 'image/png', image_data: 'data:2' },
      ];
      await c.onInsertPageDrop({
        previousIndex: 0,
        currentIndex: 1,
      } as never);
      expect(c.insertPages[0].id).toBe('b');
      expect(mockSupabase.client.from).toHaveBeenCalled();
    });
  });

  describe('openBookletPrint', () => {
    it('calls download with range and a new window on web', async () => {
      const newWin = { close: vi.fn() };
      (window.open as ReturnType<typeof vi.fn>).mockReturnValue(newWin);

      const c = createComponent();
      c.bookletRange = 'twoweeks';

      await c.openBookletPrint();

      expect(mockPrint.downloadPrintableBookletPrayerList).toHaveBeenCalledWith('twoweeks', newWin);
      expect(c.isPrinting).toBe(false);
    });
  });
});
