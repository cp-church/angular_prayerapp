import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';
import { PrayerListBookletPrintComponent } from './prayer-list-booklet-print.component';
import { PrintService } from '../../services/print.service';

describe('PrayerListBookletPrintComponent', () => {
  let mockPrint: { downloadPrintableBookletPrayerList: ReturnType<typeof vi.fn> };
  let mockCdr: { markForCheck: ReturnType<typeof vi.fn> };
  let originalOpen: typeof window.open;
  let capHolder: { Capacitor?: unknown };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrint = {
      downloadPrintableBookletPrayerList: vi.fn().mockResolvedValue(undefined),
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
      mockCdr as unknown as ChangeDetectorRef
    );
  }

  it('should create', () => {
    expect(createComponent()).toBeTruthy();
  });

  describe('onSectionToggle', () => {
    it('toggles sectionExpanded and marks for check', () => {
      const c = createComponent();
      expect(c.sectionExpanded).toBe(false);
      c.onSectionToggle();
      expect(c.sectionExpanded).toBe(true);
      c.onSectionToggle();
      expect(c.sectionExpanded).toBe(false);
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('setBookletRange', () => {
    it('updates bookletRange and marks for check', () => {
      const c = createComponent();
      expect(c.bookletRange).toBe('month');
      c.setBookletRange('week');
      expect(c.bookletRange).toBe('week');
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('openBookletPrint', () => {
    it('calls download with range and a new window on web', async () => {
      const newWin = { close: vi.fn() };
      (window.open as ReturnType<typeof vi.fn>).mockReturnValue(newWin);

      const c = createComponent();
      c.bookletRange = 'twoweeks';

      const p = c.openBookletPrint();
      expect(c.isPrinting).toBe(true);
      expect(mockCdr.markForCheck).toHaveBeenCalled();

      await p;

      expect(mockPrint.downloadPrintableBookletPrayerList).toHaveBeenCalledWith('twoweeks', newWin);
      expect(c.isPrinting).toBe(false);
    });

    it('passes null for pre-opened window on native (iOS)', async () => {
      capHolder.Capacitor = {
        getPlatform: () => 'ios',
      };

      const c = createComponent();
      await c.openBookletPrint();

      expect(window.open).not.toHaveBeenCalled();
      expect(mockPrint.downloadPrintableBookletPrayerList).toHaveBeenCalledWith(
        c.bookletRange,
        null
      );
    });

    it('passes null for pre-opened window on native (Android)', async () => {
      capHolder.Capacitor = {
        getPlatform: () => 'android',
      };

      const c = createComponent();
      await c.openBookletPrint();

      expect(window.open).not.toHaveBeenCalled();
      expect(mockPrint.downloadPrintableBookletPrayerList).toHaveBeenCalledWith('month', null);
    });

    it('treats web as non-native when platform is not ios/android', async () => {
      capHolder.Capacitor = {
        getPlatform: () => 'web',
      };
      const newWin = { close: vi.fn() };
      (window.open as ReturnType<typeof vi.fn>).mockReturnValue(newWin);

      const c = createComponent();
      await c.openBookletPrint();

      expect(window.open).toHaveBeenCalled();
      expect(mockPrint.downloadPrintableBookletPrayerList).toHaveBeenCalledWith('month', newWin);
    });

    it('logs and closes pre-opened window when download throws', async () => {
      const err = new Error('fail');
      mockPrint.downloadPrintableBookletPrayerList.mockRejectedValue(err);
      const newWin = { close: vi.fn() };
      (window.open as ReturnType<typeof vi.fn>).mockReturnValue(newWin);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const c = createComponent();
      await c.openBookletPrint();

      expect(consoleSpy).toHaveBeenCalledWith('Booklet print error', err);
      expect(newWin.close).toHaveBeenCalled();
      expect(c.isPrinting).toBe(false);
      consoleSpy.mockRestore();
    });

    it('does not call close when download throws and there was no pre-opened window', async () => {
      capHolder.Capacitor = { getPlatform: () => 'ios' };
      mockPrint.downloadPrintableBookletPrayerList.mockRejectedValue(new Error('x'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const c = createComponent();
      await c.openBookletPrint();

      expect(consoleSpy).toHaveBeenCalled();
      expect(c.isPrinting).toBe(false);
      consoleSpy.mockRestore();
    });

    it('treats as web when Capacitor getPlatform throws (isNativeApp catch)', async () => {
      capHolder.Capacitor = {
        getPlatform: () => {
          throw new Error('no platform');
        },
      };
      const newWin = { close: vi.fn() };
      (window.open as ReturnType<typeof vi.fn>).mockReturnValue(newWin);

      const c = createComponent();
      await c.openBookletPrint();

      expect(window.open).toHaveBeenCalled();
      expect(mockPrint.downloadPrintableBookletPrayerList).toHaveBeenCalledWith('month', newWin);
    });
  });

  describe('rangeOptions', () => {
    it('exposes four time range choices', () => {
      const c = createComponent();
      expect(c.rangeOptions.map(o => o.value)).toEqual(['week', 'twoweeks', 'month', 'twomonths']);
    });
  });
});
