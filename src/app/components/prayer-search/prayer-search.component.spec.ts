import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrayerSearchComponent } from './prayer-search.component';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { PrayerService } from '../../services/prayer.service';
import { ChangeDetectorRef } from '@angular/core';

describe('PrayerSearchComponent', () => {
  let component: PrayerSearchComponent;
  let mockSupabaseService: any;
  let mockToastService: any;
  let mockChangeDetectorRef: any;
  let mockPrayerService: any;

  const mockPrayer = {
    id: '123',
    title: 'Test Prayer',
    requester: 'John Doe',
    email: 'john@example.com',
    status: 'current',
    created_at: '2024-01-15T10:30:00Z',
    denial_reason: null,
    description: 'Test description',
    approval_status: 'approved',
    prayer_for: 'Jane Doe',
    prayer_updates: []
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseService = {
      getSupabaseUrl: vi.fn().mockReturnValue('https://test.supabase.co'),
      getSupabaseKey: vi.fn().mockReturnValue('test-key'),
      getClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPrayer, error: null })
            })
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
            in: vi.fn().mockResolvedValue({ error: null })
          })
        })
      })
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
      detectChanges: vi.fn()
    };

    mockPrayerService = {
      loadPrayers: vi.fn().mockResolvedValue(undefined)
    };

    component = new PrayerSearchComponent(
      mockSupabaseService,
      mockToastService,
      mockChangeDetectorRef,
      mockPrayerService
    );

    global.fetch = vi.fn();
    global.confirm = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.searchTerm).toBe('');
      expect(component.statusFilter).toBe('');
      expect(component.approvalFilter).toBe('');
      expect(component.searchResults).toEqual([]);
      expect(component.searching).toBe(false);
      expect(component.deleting).toBe(false);
      expect(component.error).toBeNull();
      expect(component.selectedPrayers).toBeInstanceOf(Set);
      expect(component.expandedCards).toBeInstanceOf(Set);
      expect(component.editingPrayer).toBeNull();
      expect(component.creatingPrayer).toBe(false);
      expect(component.saving).toBe(false);
      expect(component.bulkStatus).toBe('');
      expect(component.updatingStatus).toBe(false);
      expect(component.addingUpdate).toBeNull();
      expect(component.savingUpdate).toBe(false);
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.totalItems).toBe(0);
      expect(component.allPrayers).toEqual([]);
      expect(component.displayPrayers).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should call handleSearch', () => {
      const spy = vi.spyOn(component, 'handleSearch');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      component.allPrayers = Array.from({ length: 25 }, (_, i) => ({
        ...mockPrayer,
        id: `prayer-${i}`
      }));
      component.totalItems = 25;
    });

    it('should calculate total pages', () => {
      component.pageSize = 10;
      expect(component.totalPages).toBe(3);
    });

    it('should check if first page', () => {
      component.currentPage = 1;
      expect(component.isFirstPage).toBe(true);
      component.currentPage = 2;
      expect(component.isFirstPage).toBe(false);
    });

    it('should check if last page', () => {
      component.pageSize = 10;
      component.currentPage = 3;
      expect(component.isLastPage).toBe(true);
      component.currentPage = 2;
      expect(component.isLastPage).toBe(false);
    });

    it('should load page data', () => {
      component.currentPage = 1;
      component.pageSize = 10;
      component.loadPageData();
      expect(component.displayPrayers).toHaveLength(10);
    });

    it('should go to specific page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('should not go to invalid page', () => {
      component.goToPage(100);
      expect(component.currentPage).toBe(3);
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('should go to previous page', () => {
      component.currentPage = 2;
      component.previousPage();
      expect(component.currentPage).toBe(1);
    });

    it('should go to next page', () => {
      component.currentPage = 1;
      component.nextPage();
      expect(component.currentPage).toBe(2);
    });

    it('should change page size', () => {
      component.currentPage = 2;
      component.changePageSize();
      expect(component.currentPage).toBe(1);
    });

    it('should get pagination range', () => {
      component.allPrayers = Array.from({ length: 100 }, (_, i) => ({
        ...mockPrayer,
        id: `prayer-${i}`
      }));
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 5;

      const range = component.getPaginationRange();
      expect(range.length).toBeLessThanOrEqual(5);
    });
  });

  describe('handleSearch', () => {
    it('should fetch prayers successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPrayer]
      });

      await component.handleSearch();

      expect(component.allPrayers).toEqual([mockPrayer]);
      expect(component.totalItems).toBe(1);
      expect(component.searching).toBe(false);
    });

    it('should handle search with term', async () => {
      component.searchTerm = 'test';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPrayer]
      });

      await component.handleSearch();

      expect(component.allPrayers).toEqual([mockPrayer]);
    });

    it('should handle search with status filter', async () => {
      component.statusFilter = 'current';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPrayer]
      });

      await component.handleSearch();

      expect(component.allPrayers).toEqual([mockPrayer]);
    });

    it('should handle search with approval filter', async () => {
      component.approvalFilter = 'approved';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPrayer]
      });

      await component.handleSearch();

      expect(component.allPrayers).toEqual([mockPrayer]);
    });

    it('should filter denied prayers', async () => {
      component.approvalFilter = 'denied';
      const deniedPrayer = { ...mockPrayer, denial_reason: 'Invalid' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPrayer, deniedPrayer]
      });

      await component.handleSearch();

      expect(component.allPrayers).toHaveLength(1);
      expect(component.allPrayers[0].denial_reason).toBe('Invalid');
    });

    it('should filter pending prayers', async () => {
      component.approvalFilter = 'pending';
      const pendingPrayer = { ...mockPrayer, approval_status: 'pending' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPrayer, pendingPrayer]
      });

      await component.handleSearch();

      expect(component.allPrayers.length).toBeGreaterThan(0);
    });

    it('should handle search error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Search failed'));

      await component.handleSearch();

      expect(component.error).toBe('Search failed');
      expect(mockToastService.error).toHaveBeenCalled();
    });

    it('should handle non-ok response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error'
      });

      await component.handleSearch();

      expect(component.error).toContain('Query failed');
    });
  });

  describe('prayer creation', () => {
    it('should start create prayer', () => {
      component.startCreatePrayer();
      expect(component.creatingPrayer).toBe(true);
      expect(component.createForm.status).toBe('current');
    });

    it('should cancel create prayer', () => {
      component.creatingPrayer = true;
      component.createForm.firstName = 'Test';
      component.cancelCreatePrayer();
      expect(component.creatingPrayer).toBe(false);
      expect(component.createForm.firstName).toBe('');
    });

    it('should validate create form', () => {
      expect(component.isCreateFormValid()).toBe(false);

      component.createForm = {
        description: 'Test',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        prayer_for: 'Jane',
        status: 'current'
      };

      expect(component.isCreateFormValid()).toBe(true);
    });

    it('should create prayer successfully', async () => {
      const mockEvent = { preventDefault: vi.fn() } as any;
      component.createForm = {
        description: 'Test',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        prayer_for: 'Jane',
        status: 'current'
      };

      await component.createPrayer(mockEvent);

      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.creatingPrayer).toBe(false);
      expect(mockPrayerService.loadPrayers).toHaveBeenCalled();
    });

    it('should not create prayer with invalid form', async () => {
      const mockEvent = { preventDefault: vi.fn() } as any;
      component.createForm.firstName = '';

      await component.createPrayer(mockEvent);

      expect(component.error).toBe('All fields are required');
    });

    it('should handle create prayer error', async () => {
      const mockEvent = { preventDefault: vi.fn() } as any;
      component.createForm = {
        description: 'Test',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        prayer_for: 'Jane',
        status: 'current'
      };

      mockSupabaseService.getClient().from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Insert failed')
      });

      await component.createPrayer(mockEvent);

      expect(component.error).toContain('Failed to create prayer');
    });
  });

  describe('prayer editing', () => {
    it('should start edit prayer', () => {
      component.startEditPrayer(mockPrayer);
      expect(component.editingPrayer).toBe(mockPrayer.id);
      expect(component.editForm.title).toBe(mockPrayer.title);
      expect(component.expandedCards.has(mockPrayer.id)).toBe(true);
    });

    it('should cancel edit', () => {
      component.editingPrayer = '123';
      component.editForm.title = 'Changed';
      component.cancelEdit();
      expect(component.editingPrayer).toBeNull();
      expect(component.editForm.title).toBe('');
    });

    it('should save prayer successfully', async () => {
      component.editForm = {
        title: 'Updated Title',
        description: 'Updated description',
        requester: 'John Doe',
        email: 'john@example.com',
        prayer_for: 'Jane',
        status: 'current'
      };

      component.allPrayers = [mockPrayer];
      component.loadPageData();

      await component.savePrayer('123');

      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.editingPrayer).toBeNull();
    });

    it('should not save prayer with invalid data', async () => {
      component.editForm.title = '';

      await component.savePrayer('123');

      expect(component.error).toContain('required');
    });

    it('should handle save prayer error', async () => {
      component.editForm = {
        title: 'Updated',
        description: 'Test',
        requester: 'John',
        email: 'john@example.com',
        prayer_for: 'Jane',
        status: 'current'
      };

      mockSupabaseService.getClient().from().update().eq.mockResolvedValue({
        error: new Error('Update failed')
      });

      await component.savePrayer('123');

      expect(component.error).toContain('Failed to update prayer');
    });
  });

  describe('prayer deletion', () => {
    it('should not delete if user cancels', async () => {
      (global.confirm as any).mockReturnValue(false);

      await component.deletePrayer(mockPrayer);

      expect(mockSupabaseService.getClient().from().delete).not.toHaveBeenCalled();
    });

    it('should delete prayer successfully', async () => {
      component.allPrayers = [mockPrayer];
      component.totalItems = 1;

      await component.deletePrayer(mockPrayer);

      expect(mockToastService.success).toHaveBeenCalledWith('Prayer deleted successfully');
      expect(component.allPrayers).toHaveLength(0);
    });

    it('should handle delete error', async () => {
      mockSupabaseService.getClient().from().delete().eq.mockResolvedValue({
        error: new Error('Delete failed')
      });

      await component.deletePrayer(mockPrayer);

      expect(component.error).toContain('Failed to delete prayer');
    });

    it('should delete selected prayers', async () => {
      component.selectedPrayers = new Set(['1', '2', '3']);
      component.allPrayers = [
        { ...mockPrayer, id: '1' },
        { ...mockPrayer, id: '2' },
        { ...mockPrayer, id: '3' }
      ];
      component.totalItems = 3;

      await component.deleteSelected();

      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.selectedPrayers.size).toBe(0);
    });

    it('should not delete selected if user cancels', async () => {
      (global.confirm as any).mockReturnValue(false);
      component.selectedPrayers = new Set(['1', '2']);

      await component.deleteSelected();

      expect(mockSupabaseService.getClient().from().delete).not.toHaveBeenCalled();
    });

    it('should handle delete selected error', async () => {
      component.selectedPrayers = new Set(['1']);

      mockSupabaseService.getClient().from().delete().in.mockResolvedValue({
        error: new Error('Delete failed')
      });

      await component.deleteSelected();

      expect(component.error).toContain('Failed to delete');
    });
  });

  describe('bulk status update', () => {
    it('should not update if no prayers selected', async () => {
      component.selectedPrayers = new Set();

      await component.updateSelectedStatus();

      expect(mockSupabaseService.getClient().from().update).not.toHaveBeenCalled();
    });

    it('should not update if user cancels', async () => {
      (global.confirm as any).mockReturnValue(false);
      component.selectedPrayers = new Set(['1', '2']);
      component.bulkStatus = 'archived';

      await component.updateSelectedStatus();

      expect(mockSupabaseService.getClient().from().update).not.toHaveBeenCalled();
    });

    it('should update selected status successfully', async () => {
      component.selectedPrayers = new Set(['1', '2']);
      component.bulkStatus = 'archived';
      component.allPrayers = [
        { ...mockPrayer, id: '1' },
        { ...mockPrayer, id: '2' }
      ];

      // Mock the update chain
      const mockIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ in: mockIn });
      mockSupabaseService.getClient().from = vi.fn().mockReturnValue({ update: mockUpdate });

      await component.updateSelectedStatus();

      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.selectedPrayers.size).toBe(0);
      expect(component.bulkStatus).toBe('');
    });

    it('should handle update selected error', async () => {
      component.selectedPrayers = new Set(['1']);
      component.bulkStatus = 'archived';

      // Mock the update chain with error
      const mockIn = vi.fn().mockResolvedValue({ error: new Error('Update failed') });
      const mockUpdate = vi.fn().mockReturnValue({ in: mockIn });
      mockSupabaseService.getClient().from = vi.fn().mockReturnValue({ update: mockUpdate });

      await component.updateSelectedStatus();

      expect(component.error).toContain('Failed to update');
    });
  });

  describe('prayer updates management', () => {
    it('should validate update form', () => {
      expect(component.isUpdateFormValid()).toBe(false);

      component.newUpdate = {
        content: 'Test content',
        firstName: 'John',
        lastName: 'Doe',
        author_email: 'john@example.com'
      };

      expect(component.isUpdateFormValid()).toBe(true);
    });

    it('should save new update successfully', async () => {
      component.newUpdate = {
        content: 'Test',
        firstName: 'John',
        lastName: 'Doe',
        author_email: 'john@example.com'
      };

      component.allPrayers = [mockPrayer];

      await component.saveNewUpdate('123');

      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.addingUpdate).toBeNull();
    });

    it('should not save update with invalid form', async () => {
      component.newUpdate.content = '';

      await component.saveNewUpdate('123');

      expect(component.error).toBe('All fields are required');
    });

    it('should cancel add update', () => {
      component.addingUpdate = '123';
      component.newUpdate.content = 'Test';
      component.cancelAddUpdate();
      expect(component.addingUpdate).toBeNull();
      expect(component.newUpdate.content).toBe('');
    });

    it('should delete update successfully', async () => {
      component.allPrayers = [{
        ...mockPrayer,
        prayer_updates: [{ id: 'update-1', content: 'Test', author: 'John', created_at: '2024-01-01' }]
      }];

      await component.deleteUpdate('123', 'update-1', 'Test content');

      expect(mockToastService.success).toHaveBeenCalled();
    });

    it('should not delete update if user cancels', async () => {
      (global.confirm as any).mockReturnValue(false);

      await component.deleteUpdate('123', 'update-1', 'Test');

      expect(mockSupabaseService.getClient().from().delete).not.toHaveBeenCalled();
    });
  });

  describe('selection management', () => {
    it('should toggle select prayer', () => {
      component.toggleSelectPrayer('123');
      expect(component.selectedPrayers.has('123')).toBe(true);
      component.toggleSelectPrayer('123');
      expect(component.selectedPrayers.has('123')).toBe(false);
    });

    it('should toggle select all', () => {
      component.displayPrayers = [
        { ...mockPrayer, id: '1' },
        { ...mockPrayer, id: '2' }
      ];

      component.toggleSelectAll();
      expect(component.selectedPrayers.size).toBe(2);

      component.toggleSelectAll();
      expect(component.selectedPrayers.size).toBe(0);
    });

    it('should toggle expand card', () => {
      component.toggleExpandCard('123');
      expect(component.expandedCards.has('123')).toBe(true);
      component.toggleExpandCard('123');
      expect(component.expandedCards.has('123')).toBe(false);
    });
  });

  describe('filter handling', () => {
    it('should handle status filter change', () => {
      const spy = vi.spyOn(component, 'handleSearch');
      component.statusFilter = 'current';
      component.onStatusFilterChange();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle approval filter change', () => {
      const spy = vi.spyOn(component, 'handleSearch');
      component.approvalFilter = 'approved';
      component.onApprovalFilterChange();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle key press', () => {
      const spy = vi.spyOn(component, 'handleSearch');
      const mockEvent = { key: 'Enter' } as any;
      component.onKeyPress(mockEvent);
      expect(spy).toHaveBeenCalled();
    });

    it('should not search on other keys', () => {
      const spy = vi.spyOn(component, 'handleSearch');
      const mockEvent = { key: 'a' } as any;
      component.onKeyPress(mockEvent);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('clearSearch', () => {
    it('should clear search state', () => {
      component.searchTerm = 'test';
      component.allPrayers = [mockPrayer];
      component.displayPrayers = [mockPrayer];
      component.selectedPrayers = new Set(['123']);
      component.error = 'Error';

      component.clearSearch();

      expect(component.searchTerm).toBe('');
      expect(component.allPrayers).toEqual([]);
      expect(component.displayPrayers).toEqual([]);
      expect(component.selectedPrayers.size).toBe(0);
      expect(component.error).toBeNull();
    });
  });

  describe('status color helpers', () => {
    it('should return correct status color', () => {
      expect(component.getStatusColor('current')).toContain('blue');
      expect(component.getStatusColor('answered')).toContain('green');
      expect(component.getStatusColor('archived')).toContain('gray');
      expect(component.getStatusColor('unknown')).toContain('gray');
    });

    it('should return correct approval status color', () => {
      expect(component.getApprovalStatusColor('approved')).toContain('green');
      expect(component.getApprovalStatusColor('denied')).toContain('red');
      expect(component.getApprovalStatusColor('pending')).toContain('yellow');
      expect(component.getApprovalStatusColor('unknown')).toContain('gray');
    });
  });

  describe('Math property', () => {
    it('should have Math property', () => {
      expect(component.Math).toBe(Math);
    });
  });
});
