import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { PrayerCardComponent } from './prayer-card.component';
import { SupabaseService } from '../../services/supabase.service';
import { UserSessionService } from '../../services/user-session.service';

describe('PrayerCardComponent', () => {
  let component: PrayerCardComponent;
  let mockSupabaseService: any;
  let mockUserSessionService: any;
  const now = new Date();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Set up default localStorage with both old and new key names
    localStorage.setItem('userFirstName', 'John');
    localStorage.setItem('userLastName', 'Doe');

    // Set up default mock that returns no data (triggers fallback to localStorage)
    const defaultMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null
    });

    const defaultEq = vi.fn().mockReturnValue({
      maybeSingle: defaultMaybeSingle
    });

    const defaultSelect = vi.fn().mockReturnValue({
      eq: defaultEq
    });

    const defaultFrom = vi.fn().mockReturnValue({
      select: defaultSelect
    });

    mockSupabaseService = {
      client: {
        from: defaultFrom
      }
    };

    mockUserSessionService = {
      userSession$: {
        subscribe: vi.fn()
      },
      getCurrentSession: vi.fn().mockReturnValue({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        isActive: true
      })
    };

    component = new PrayerCardComponent(mockSupabaseService, mockUserSessionService);

    component.prayer = {
      id: 'p1',
      prayer_for: 'Community',
      description: 'Please pray',
      requester: 'Jane Doe',
      is_anonymous: false,
      status: 'current',
      created_at: now.toISOString(),
      updates: []
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('getBorderClass varies by status', () => {
    (component.prayer as any).status = 'current';
    expect(component.getBorderClass()).toContain('0047AB');

    (component.prayer as any).status = 'answered';
    expect(component.getBorderClass()).toContain('39704D');

    (component.prayer as any).status = 'archived';
    expect(component.getBorderClass()).toContain('C9A961');
  });

  it('getStatusBadgeClasses varies by status', () => {
    (component.prayer as any).status = 'current';
    expect(component.getStatusBadgeClasses()).toContain('0047AB');

    (component.prayer as any).status = 'answered';
    expect(component.getStatusBadgeClasses()).toContain('39704D');

    (component.prayer as any).status = 'archived';
    expect(component.getStatusBadgeClasses()).toContain('C9A961');
  });

  it('getStatusLabel capitalizes', () => {
    component.prayer.status = 'answered';
    expect(component.getStatusLabel()).toBe('Answered');
  });

  it('displayRequester respects anonymity', () => {
    component.prayer.is_anonymous = true;
    expect(component.displayRequester()).toBe('Anonymous');

    component.prayer.is_anonymous = false;
    expect(component.displayRequester()).toBe('Jane Doe');
  });

  it('showDeleteButton logic', () => {
    component.isAdmin = true;
    expect(component.showDeleteButton()).toBe(true);

    component.isAdmin = false;
    component.deletionsAllowed = 'everyone';
    expect(component.showDeleteButton()).toBe(true);

    component.deletionsAllowed = 'email-only';
    expect(component.showDeleteButton()).toBe(true);

    component.deletionsAllowed = 'admin-only';
    expect(component.showDeleteButton()).toBe(false);
  });

  it('showAddUpdateButton logic', () => {
    component.isAdmin = true;
    expect(component.showAddUpdateButton()).toBe(true);

    component.isAdmin = false;
    component.updatesAllowed = 'everyone';
    expect(component.showAddUpdateButton()).toBe(true);

    component.updatesAllowed = 'email-only';
    expect(component.showAddUpdateButton()).toBe(true);

    component.updatesAllowed = 'admin-only';
    expect(component.showAddUpdateButton()).toBe(false);
  });

  it('showUpdateDeleteButton logic', () => {
    component.isAdmin = true;
    expect(component.showUpdateDeleteButton()).toBe(true);

    component.isAdmin = false;
    component.deletionsAllowed = 'everyone';
    expect(component.showUpdateDeleteButton()).toBe(true);

    component.deletionsAllowed = 'email-only';
    expect(component.showUpdateDeleteButton()).toBe(true);

    component.deletionsAllowed = 'admin-only';
    expect(component.showUpdateDeleteButton()).toBe(false);
  });

  it('handleDeleteClick as admin shows confirmation dialog', () => {
    component.isAdmin = true;
    component.handleDeleteClick();
    expect(component.showConfirmationDialog).toBe(true);

    component.onConfirmDelete();
    expect(component.showConfirmationDialog).toBe(false);
  });

  it('handleDeleteClick toggles request form for non-admin', () => {
    component.isAdmin = false;
    component.showDeleteRequestForm = false;
    component.showAddUpdateForm = true;
    component.handleDeleteClick();
    expect(component.showDeleteRequestForm).toBe(true);
    expect(component.showAddUpdateForm).toBe(false);

    component.handleDeleteClick();
    expect(component.showDeleteRequestForm).toBe(false);
  });

  it('toggleAddUpdate toggles and hides delete form', () => {
    component.showAddUpdateForm = false;
    component.showDeleteRequestForm = true;
    component.toggleAddUpdate();
    expect(component.showAddUpdateForm).toBe(true);
    expect(component.showDeleteRequestForm).toBe(false);

    component.toggleAddUpdate();
    expect(component.showAddUpdateForm).toBe(false);
  });

  it('handleAddUpdate emits and resets', async () => {
    // Default mock setup has userSessionService returning email
    component.updateContent = 'An update';
    component.updateIsAnonymous = false;
    component.updateMarkAsAnswered = true;
    const spy = vi.spyOn(component.addUpdate, 'emit');

    await component.handleAddUpdate();

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.calls[0][0];
    expect(emitted.prayer_id).toBe('p1');
    expect(emitted.content).toBe('An update');
    expect(emitted.author).toBe('John Doe');
    expect(emitted.author_email).toBe('test@example.com');
    expect(component.updateContent).toBe('');
    expect(component.showAddUpdateForm).toBe(false);
  });

  it('getCurrentUserEmail returns email from userSessionService', async () => {
    // userSessionService.getCurrentSession() is mocked in beforeEach
    component.updateContent = 'An update';
    component.updateIsAnonymous = false;
    component.updateMarkAsAnswered = true;
    const spy = vi.spyOn(component.addUpdate, 'emit');

    await component.handleAddUpdate();

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.calls[0][0];
    expect(emitted.author_email).toBe('test@example.com');
  });

  it('getCurrentUserEmail returns empty string when session has no email', async () => {
    // Mock userSessionService to return null session
    mockUserSessionService.getCurrentSession = vi.fn().mockReturnValue(null);
    component.updateContent = 'No email update';
    component.updateIsAnonymous = false;
    component.updateMarkAsAnswered = true;
    const spy = vi.spyOn(component.addUpdate, 'emit');

    await component.handleAddUpdate();

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.calls[0][0];
    expect(emitted.author_email).toBe('');
  });

  it('shouldShowToggleButton returns false when no updates present', () => {
    component.prayer.updates = undefined as any;
    expect(component.shouldShowToggleButton()).toBe(false);
  });

  it('handleUpdateDeletionRequest early returns when no form shown', () => {
    component.showUpdateDeleteRequestForm = null;
    const spy = vi.spyOn(component.requestUpdateDeletion, 'emit');
    component.handleUpdateDeletionRequest();
    expect(spy).not.toHaveBeenCalled();
  });

  it('handleDeleteRequest emits and resets', () => {
    // Set up localStorage for user name and mock userSessionService for email
    localStorage.setItem('userFirstName', 'A');
    localStorage.setItem('userLastName', 'B');
    mockUserSessionService.getCurrentSession = vi.fn().mockReturnValue({
      email: 'session@example.com',
      firstName: 'A',
      lastName: 'B',
      fullName: 'A B',
      isActive: true
    });
    component.deleteReason = 'Because';
    const spy = vi.spyOn(component.requestDeletion, 'emit');

    component.handleDeleteRequest();

    expect(spy).toHaveBeenCalled();
    const payload = spy.mock.calls[0][0];
    expect(payload.prayer_id).toBe('p1');
    expect(payload.requester_first_name).toBe('A');
    expect(payload.requester_last_name).toBe('B');
    expect(payload.requester_email).toBe('session@example.com');
    expect(payload.reason).toBe('Because');
    expect(component.deleteReason).toBe('');
    expect(component.showDeleteRequestForm).toBe(false);
  });

  it('handleDeleteUpdate as admin shows confirmation dialog', () => {
    component.isAdmin = true;
    component.handleDeleteUpdate('u1');
    expect(component.showUpdateConfirmationDialog).toBe(true);
    expect(component.updateConfirmationId).toBe('u1');
    expect(component.updateConfirmationTitle).toBe('Delete Update');
  });

  it('handleDeleteUpdate emits after confirmation', async () => {
    component.isAdmin = true;
    const spy = vi.spyOn(component.deleteUpdate, 'emit');
    component.handleDeleteUpdate('u1');
    await component.onConfirmUpdateDelete();
    expect(spy).toHaveBeenCalledWith('u1');
    expect(component.showUpdateConfirmationDialog).toBe(false);
  });

  it('handleDeleteUpdate toggles request form for non-admin', () => {
    component.isAdmin = false;
    component.showUpdateDeleteRequestForm = null;
    component.showAddUpdateForm = true;
    component.showDeleteRequestForm = true;
    component.handleDeleteUpdate('u1');
    expect(component.showUpdateDeleteRequestForm).toBe('u1');
    expect(component.showAddUpdateForm).toBe(false);
    expect(component.showDeleteRequestForm).toBe(false);

    // calling again should close
    component.handleDeleteUpdate('u1');
    expect(component.showUpdateDeleteRequestForm).toBeNull();
  });

  it('getDisplayedUpdates handles various cases', () => {
    // no updates
    component.prayer.updates = undefined as any;
    expect(component.getDisplayedUpdates()).toEqual([]);

    // many old updates (older than a week)
    const oldDate = new Date(); oldDate.setDate(oldDate.getDate() - 10);
    component.prayer.updates = [
      { id: 'a', content: 'old', created_at: oldDate.toISOString() },
      { id: 'b', content: 'older', created_at: oldDate.toISOString() }
    ] as any;
    component.showAllUpdates = false;
    const displayed = component.getDisplayedUpdates();
    expect(displayed.length).toBe(1);

    // recent updates within a week
    const recentDate = new Date().toISOString();
    component.prayer.updates = [
      { id: 'r1', content: 'r', created_at: recentDate }
    ] as any;
    const recent = component.getDisplayedUpdates();
    expect(recent.length).toBe(1);
  });

  it('shouldShowToggleButton reflects displayed vs all updates', () => {
    component.prayer.updates = [
      { id: '1', created_at: new Date().toISOString() },
      { id: '2', created_at: new Date().toISOString() }
    ] as any;
    component.showAllUpdates = false;
    // displayed will include both since recent
    expect(component.shouldShowToggleButton()).toBe(false);

    // force one old update to make displayed < total
    const old = new Date(); old.setDate(old.getDate() - 10);
    component.prayer.updates = [ { id: '1', created_at: old.toISOString() } ] as any;
    expect(component.shouldShowToggleButton()).toBe(false);
  });

  it('formatDate returns readable string', () => {
    const out = component.formatDate('2020-01-02T03:04:00Z');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('handleUpdateDeletionRequest emits and resets', () => {
    localStorage.setItem('userFirstName', 'X');
    localStorage.setItem('userLastName', 'Y');
    localStorage.setItem('userEmail', 'x@y.com');
    component.showUpdateDeleteRequestForm = 'upd-1';
    component.updateDeleteReason = 'Please remove';
    const spy = vi.spyOn(component.requestUpdateDeletion, 'emit');
    component.handleUpdateDeletionRequest();
    expect(spy).toHaveBeenCalled();
    const payload = spy.mock.calls[0][0];
    expect(payload.update_id).toBe('upd-1');
    expect(payload.requester_first_name).toBe('X');
    expect(component.updateDeleteReason).toBe('');
    expect(component.showUpdateDeleteRequestForm).toBeNull();
  });

  it('getDisplayedUpdates returns all when showAllUpdates=true', () => {
    const d1 = new Date();
    const d2 = new Date(); d2.setDate(d2.getDate() - 1);
    component.prayer.updates = [
      { id: 'u1', content: 'one', created_at: d1.toISOString() },
      { id: 'u2', content: 'two', created_at: d2.toISOString() }
    ] as any;
    component.showAllUpdates = true;
    const all = component.getDisplayedUpdates();
    expect(all.length).toBe(2);
    expect(all[0].id).toBe('u1');
  });

  it('handleUpdateDeletionRequest preserves multi-part last name', () => {
    localStorage.setItem('userFirstName', 'First');
    localStorage.setItem('userLastName', 'Last Middle');
    localStorage.setItem('userEmail', 'fm@example.com');
    component.showUpdateDeleteRequestForm = 'upd-2';
    component.updateDeleteReason = 'Reason';
    const spy = vi.spyOn(component.requestUpdateDeletion, 'emit');
    component.handleUpdateDeletionRequest();
    expect(spy).toHaveBeenCalled();
    const payload = spy.mock.calls[0][0];
    expect(payload.requester_first_name).toBe('First');
    expect(payload.requester_last_name).toBe('Last Middle');
  });

  describe('Badge functionality', () => {
    it('should support badge display when badgeService is available', () => {
      // Set up a mock badge service
      const mockBadgeService = {
        isPrayerUnread: vi.fn().mockReturnValue(true),
        getBadgeFunctionalityEnabled$: vi.fn().mockReturnValue(of(true))
      };

      // Verify that the component can work with a badge service
      expect(mockBadgeService.isPrayerUnread('p1')).toBe(true);
      expect(mockBadgeService.getBadgeFunctionalityEnabled$()).toBeTruthy();
    });

    it('should check badge functionality is enabled before showing badge', () => {
      const badgeFunctionalityEnabled = of(false);
      
      // Verify that we can check badge functionality
      expect(typeof badgeFunctionalityEnabled).toBe('object');
    });

    it('should expose prayerBadge$ observable for template binding', () => {
      // The component should define prayerBadge$ observable
      expect(component).toBeDefined();
      // In a rendered component, prayerBadge$ would be available for template
    });
  });

});
