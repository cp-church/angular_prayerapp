import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminPrayerApprovalComponent } from './admin-prayer-approval.component';
import type { PrayerRequest } from '../../services/prayer.service';
import type { AdminDataService } from '../../services/admin-data.service';
import type { ToastService } from '../../services/toast.service';
import type { ChangeDetectorRef } from '@angular/core';

describe('AdminPrayerApprovalComponent', () => {
  let component: AdminPrayerApprovalComponent;
  let mockAdminDataService: { editPrayer: ReturnType<typeof vi.fn> };
  let mockToast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockCdr: { markForCheck: ReturnType<typeof vi.fn> };

  const basePrayer: PrayerRequest = {
    id: 'test-prayer-1',
    title: 'Test Prayer Request',
    description: 'Please pray for this test request',
    status: 'current',
    requester: 'John Doe',
    prayer_for: 'Health',
    email: 'john@example.com',
    date_requested: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    updates: [],
  };

  beforeEach(() => {
    mockAdminDataService = {
      editPrayer: vi.fn().mockResolvedValue(undefined),
    };
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockCdr = { markForCheck: vi.fn() };

    component = new AdminPrayerApprovalComponent(
      mockAdminDataService as unknown as AdminDataService,
      mockToast as unknown as ToastService,
      mockCdr as unknown as ChangeDetectorRef
    );
    component.prayer = { ...basePrayer };
  });

  it('should create with default state', () => {
    expect(component.isDenying).toBe(false);
    expect(component.denialReason).toBe('');
    expect(component.isEditingDescription).toBe(false);
    expect(component.isSavingDescription).toBe(false);
    expect(component.editedDescription).toBe('');
  });

  it('exposes outputs', () => {
    expect(component.onApprove).toBeDefined();
    expect(component.onDeny).toBeDefined();
    expect(component.onEdit).toBeDefined();
    expect(component.onDelete).toBeDefined();
    expect(component.onToggleUpdateAnswered).toBeDefined();
    expect(component.onToggleMemberUpdateAnswered).toBeDefined();
  });

  describe('startDescriptionEdit / cancelDescriptionEdit', () => {
    it('startDescriptionEdit copies prayer description and opens editor', () => {
      component.startDescriptionEdit();
      expect(component.isEditingDescription).toBe(true);
      expect(component.editedDescription).toBe('Please pray for this test request');
    });

    it('startDescriptionEdit uses empty string when description is missing', () => {
      component.prayer = { ...basePrayer, description: undefined as unknown as string };
      component.startDescriptionEdit();
      expect(component.editedDescription).toBe('');
    });

    it('cancelDescriptionEdit closes editor and clears draft', () => {
      component.startDescriptionEdit();
      component.editedDescription = 'edited';
      component.cancelDescriptionEdit();
      expect(component.isEditingDescription).toBe(false);
      expect(component.editedDescription).toBe('');
    });
  });

  describe('saveDescription', () => {
    it('updates prayer via AdminDataService, emits onEdit, shows success, and closes editor', async () => {
      const editSpy = vi.fn();
      component.onEdit.subscribe(editSpy);
      component.startDescriptionEdit();
      component.editedDescription = 'New body';

      await component.saveDescription();

      expect(mockAdminDataService.editPrayer).toHaveBeenCalledWith('test-prayer-1', {
        description: 'New body',
      });
      expect(component.prayer.description).toBe('New body');
      expect(editSpy).toHaveBeenCalledWith({
        id: 'test-prayer-1',
        updates: { description: 'New body' },
      });
      expect(mockToast.success).toHaveBeenCalledWith('Description updated.');
      expect(component.isEditingDescription).toBe(false);
      expect(component.isSavingDescription).toBe(false);
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('shows error toast when editPrayer rejects', async () => {
      mockAdminDataService.editPrayer.mockRejectedValueOnce(new Error('network'));
      const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.startDescriptionEdit();
      component.editedDescription = 'x';

      await component.saveDescription();

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update description.');
      expect(component.isEditingDescription).toBe(true);
      warn.mockRestore();
    });

    it('returns immediately when save is already in progress', async () => {
      mockAdminDataService.editPrayer.mockImplementation(
        () => new Promise(() => {})
      );
      component.startDescriptionEdit();

      void component.saveDescription();
      await Promise.resolve();

      await component.saveDescription();

      expect(mockAdminDataService.editPrayer).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDeny', () => {
    it('emits id and reason, then resets denial state', () => {
      const spy = vi.fn();
      component.onDeny.subscribe(spy);
      component.isDenying = true;
      component.denialReason = 'Not appropriate';

      component.handleDeny();

      expect(spy).toHaveBeenCalledWith({ id: 'test-prayer-1', reason: 'Not appropriate' });
      expect(component.isDenying).toBe(false);
      expect(component.denialReason).toBe('');
    });

    it('emits null reason when denialReason is empty', () => {
      const spy = vi.fn();
      component.onDeny.subscribe(spy);
      component.denialReason = '';

      component.handleDeny();

      expect(spy).toHaveBeenCalledWith({ id: 'test-prayer-1', reason: null });
    });

    it('preserves non-empty whitespace as reason (|| only treats empty string as falsy)', () => {
      const spy = vi.fn();
      component.onDeny.subscribe(spy);
      component.denialReason = '   ';

      component.handleDeny();

      expect(spy).toHaveBeenCalledWith({ id: 'test-prayer-1', reason: '   ' });
    });
  });

  describe('onApprove', () => {
    it('emits prayer id', () => {
      const spy = vi.fn();
      component.onApprove.subscribe(spy);
      component.onApprove.emit(basePrayer.id);
      expect(spy).toHaveBeenCalledWith('test-prayer-1');
    });
  });
});
