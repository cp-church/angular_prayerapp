import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserMemorizationReminderService } from './user-memorization-reminder.service';
import { SupabaseService } from './supabase.service';
import { UserSessionService } from './user-session.service';

/** Must match STALE_MS in user-memorization-reminder.service.ts */
const STALE_MS = 10 * 60 * 1000;

function flushMicrotasks(): Promise<void> {
  return Promise.resolve().then(() => Promise.resolve());
}

describe('UserMemorizationReminderService', () => {
  let service: UserMemorizationReminderService;
  let mockSupabase: { client: { from: ReturnType<typeof vi.fn> } };
  let mockUserSession: {
    getCurrentSession: ReturnType<typeof vi.fn>;
    updateUserSession: ReturnType<typeof vi.fn>;
  };
  let selectOrderMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    selectOrderMock = vi.fn(() =>
      Promise.resolve({
        data: [{ id: '1', iana_timezone: 'UTC', local_hour: 9 }],
        error: null,
      })
    );
    mockSupabase = {
      client: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: selectOrderMock,
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        })),
      },
    };
    mockUserSession = {
      getCurrentSession: vi.fn(() => ({
        email: 'user@example.com',
      })),
      updateUserSession: vi.fn(() => Promise.resolve()),
    };
    service = new UserMemorizationReminderService(
      mockSupabase as unknown as SupabaseService,
      mockUserSession as unknown as UserSessionService
    );
  });

  it('ensureLoaded returns [] when there is no session', async () => {
    mockUserSession.getCurrentSession.mockReturnValue(null);
    await expect(service.ensureLoaded()).resolves.toEqual([]);
  });

  it('ensureLoaded fetches when cache undefined', async () => {
    mockUserSession.getCurrentSession.mockReturnValue({
      email: 'user@example.com',
      memorizationHourReminders: undefined,
    });
    const slots = await service.ensureLoaded(true);
    expect(slots).toHaveLength(1);
    expect(mockUserSession.updateUserSession).toHaveBeenCalled();
  });

  it('ensureLoaded returns cache when fresh', async () => {
    const cached = [{ id: 'x', iana_timezone: 'UTC', local_hour: 8 }];
    mockUserSession.getCurrentSession.mockReturnValue({
      email: 'user@example.com',
      memorizationHourReminders: cached,
      memorizationHourRemindersFetchedAt: Date.now(),
    });
    const slots = await service.ensureLoaded(false);
    expect(slots).toEqual(cached);
    expect(mockSupabase.client.from).not.toHaveBeenCalled();
  });

  it('ensureLoaded returns stale cache and triggers background refresh', async () => {
    const cached = [{ id: 'x', iana_timezone: 'UTC', local_hour: 8 }];
    mockUserSession.getCurrentSession.mockReturnValue({
      email: 'user@example.com',
      memorizationHourReminders: cached,
      memorizationHourRemindersFetchedAt: Date.now() - STALE_MS - 1,
    });
    const slots = await service.ensureLoaded(false);
    expect(slots).toEqual(cached);
    expect(mockSupabase.client.from).toHaveBeenCalled();
    await flushMicrotasks();
    expect(mockUserSession.updateUserSession).toHaveBeenCalled();
  });

  it('does not update session when logged-in user changed before fetch completes', async () => {
    mockUserSession.getCurrentSession.mockReturnValue({
      email: 'user@example.com',
      memorizationHourReminders: undefined,
    });

    let resolveFetch!: (value: {
      data: { id: string; iana_timezone: string; local_hour: number }[];
      error: null;
    }) => void;
    const fetchPromise = new Promise<{
      data: { id: string; iana_timezone: string; local_hour: number }[];
      error: null;
    }>((resolve) => {
      resolveFetch = resolve;
    });
    selectOrderMock.mockReturnValueOnce(fetchPromise);

    const loadPromise = service.ensureLoaded(true);
    mockUserSession.getCurrentSession.mockReturnValue({
      email: 'other@example.com',
    });
    resolveFetch({
      data: [{ id: '1', iana_timezone: 'UTC', local_hour: 9 }],
      error: null,
    });

    const slots = await loadPromise;
    expect(slots).toHaveLength(1);
    expect(mockUserSession.updateUserSession).not.toHaveBeenCalled();
  });

  it('does not apply stale background fetch after addSlot invalidates generation', async () => {
    const cached = [{ id: 'old', iana_timezone: 'UTC', local_hour: 8 }];
    mockUserSession.getCurrentSession.mockReturnValue({
      email: 'user@example.com',
      memorizationHourReminders: cached,
      memorizationHourRemindersFetchedAt: Date.now() - STALE_MS - 1,
    });

    let resolveBackground!: (value: {
      data: { id: string; iana_timezone: string; local_hour: number }[];
      error: null;
    }) => void;
    const backgroundPromise = new Promise<{
      data: { id: string; iana_timezone: string; local_hour: number }[];
      error: null;
    }>((resolve) => {
      resolveBackground = resolve;
    });
    selectOrderMock.mockReturnValueOnce(backgroundPromise);

    void service.ensureLoaded(false);

    selectOrderMock.mockResolvedValueOnce({
      data: [{ id: 'new', iana_timezone: 'UTC', local_hour: 9 }],
      error: null,
    });
    await service.addSlot('user@example.com', 'UTC', 9);
    expect(mockUserSession.updateUserSession).toHaveBeenCalledWith(
      expect.objectContaining({
        memorizationHourReminders: [
          { id: 'new', iana_timezone: 'UTC', local_hour: 9 },
        ],
      })
    );
    mockUserSession.updateUserSession.mockClear();

    resolveBackground({
      data: [{ id: 'stale', iana_timezone: 'UTC', local_hour: 1 }],
      error: null,
    });
    await backgroundPromise;
    await flushMicrotasks();

    expect(mockUserSession.updateUserSession).not.toHaveBeenCalled();
  });

  it('addSlot inserts and returns updated slots', async () => {
    const slots = await service.addSlot(' user@example.com ', 'America/Chicago', 7);
    expect(slots).toHaveLength(1);
    expect(mockSupabase.client.from).toHaveBeenCalledWith(
      'user_memorization_hour_reminders'
    );
  });

  it('removeSlot deletes and returns updated slots', async () => {
    const slots = await service.removeSlot(' user@example.com ', 'slot-id-1');
    expect(slots).toHaveLength(1);
    expect(mockUserSession.updateUserSession).toHaveBeenCalled();
  });
});
