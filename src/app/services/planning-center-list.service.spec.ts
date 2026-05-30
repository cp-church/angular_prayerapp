import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { combineLatest, firstValueFrom } from 'rxjs';
import { PlanningCenterListService } from './planning-center-list.service';

vi.mock('../../lib/planning-center', () => ({
  fetchListMembers: vi.fn()
}));

import { fetchListMembers } from '../../lib/planning-center';

const CACHE_KEY = 'prayerapp_planning_center_list_user@example.com';

describe('PlanningCenterListService', () => {
  let service: PlanningCenterListService;
  let mockSupabase: any;
  let mockUserSession: any;
  let maybeSingle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    maybeSingle = vi.fn();
    mockSupabase = {
      client: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle
        }))
      }
    };

    mockUserSession = {
      getCurrentSession: vi.fn().mockReturnValue({ email: 'user@example.com' })
    };

    service = new PlanningCenterListService(mockSupabase as any, mockUserSession as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function writeCache(listId: string | null, members: Array<{ id: string; name: string }>) {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: {
          email: 'user@example.com',
          listId,
          members,
          listName: null
        },
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000
      })
    );
  }

  it('hydrates list id and members from per-user cache before DB resolves', async () => {
    writeCache('list-1', [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' }
    ]);

    let resolveDb: (value: unknown) => void = () => {};
    maybeSingle.mockReturnValue(new Promise(resolve => {
      resolveDb = resolve;
    }));

    const loadPromise = service.loadForUser('user@example.com');

    expect(service.getCurrentListId()).toBe('list-1');
    expect(service.getCurrentMembers()).toHaveLength(2);
    expect(await firstValueFrom(service.listId$)).toBe('list-1');

    resolveDb({ data: { planning_center_list_id: 'list-1' }, error: null });
    await loadPromise;

    expect(fetchListMembers).not.toHaveBeenCalled();
  });

  it('never pairs a new list id with members from the previous list', async () => {
    service['listIdSubject'].next('list-1');
    service['membersSubject'].next([{ id: 'old-member', name: 'Old' }]);

    const emissions: Array<{ listId: string | null; memberIds: string[] }> = [];
    const sub = combineLatest([service.listId$, service.members$]).subscribe(([listId, members]) => {
      emissions.push({ listId, memberIds: members.map(m => m.id) });
    });

    maybeSingle.mockResolvedValue({ data: { planning_center_list_id: 'list-2' }, error: null });
    vi.mocked(fetchListMembers).mockResolvedValue({
      members: [{ id: 'new-member', name: 'New' }]
    });

    await service.loadForUser('user@example.com');
    sub.unsubscribe();

    const stalePairing = emissions.some(
      e => e.listId === 'list-2' && e.memberIds.includes('old-member')
    );
    expect(stalePairing).toBe(false);
    expect(service.getCurrentListId()).toBe('list-2');
    expect(service.getCurrentMembers()).toEqual([{ id: 'new-member', name: 'New' }]);
  });

  it('clears members and cache roster when fetch fails after list id changes', async () => {
    writeCache('list-1', [{ id: 'old-member', name: 'Old' }]);
    service['listIdSubject'].next('list-1');
    service['membersSubject'].next([{ id: 'old-member', name: 'Old' }]);

    const emissions: Array<{ listId: string | null; memberIds: string[] }> = [];
    const sub = combineLatest([service.listId$, service.members$]).subscribe(([listId, members]) => {
      emissions.push({ listId, memberIds: members.map(m => m.id) });
    });

    maybeSingle.mockResolvedValue({ data: { planning_center_list_id: 'list-2' }, error: null });
    vi.mocked(fetchListMembers).mockResolvedValue({
      members: [],
      error: 'Planning Center unavailable'
    });

    await service.loadForUser('user@example.com');
    sub.unsubscribe();

    expect(emissions.some(e => e.listId === 'list-2' && e.memberIds.includes('old-member'))).toBe(false);
    expect(service.getCurrentListId()).toBe('list-2');
    expect(service.getCurrentMembers()).toEqual([]);

    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
    expect(stored.data.listId).toBe('list-2');
    expect(stored.data.members).toEqual([]);
  });

  it('fetches members from API on cache miss when list id exists', async () => {
    maybeSingle.mockResolvedValue({ data: { planning_center_list_id: 'list-2' }, error: null });
    vi.mocked(fetchListMembers).mockResolvedValue({
      members: [{ id: 'x', name: 'Chris' }]
    });

    await service.loadForUser('user@example.com');

    expect(fetchListMembers).toHaveBeenCalledWith('list-2', expect.any(String), expect.any(String));
    expect(service.getCurrentMembers()).toEqual([{ id: 'x', name: 'Chris' }]);
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
    expect(stored.data.listId).toBe('list-2');
  });

  it('clears members when subscriber has no list id', async () => {
    writeCache('old-list', [{ id: 'm1', name: 'Alice' }]);
    maybeSingle.mockResolvedValue({ data: { planning_center_list_id: null }, error: null });

    await service.loadForUser('user@example.com');

    expect(service.getCurrentListId()).toBeNull();
    expect(service.getCurrentMembers()).toEqual([]);
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
    expect(stored.data.listId).toBeNull();
    expect(stored.data.members).toEqual([]);
  });

  it('ignores cache when email does not match', async () => {
    writeCache('list-1', [{ id: 'm1', name: 'Alice' }]);
    const raw = localStorage.getItem(CACHE_KEY)!;
    const parsed = JSON.parse(raw);
    parsed.data.email = 'other@example.com';
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));

    maybeSingle.mockResolvedValue({ data: { planning_center_list_id: null }, error: null });

    await service.loadForUser('user@example.com');

    expect(service.getCurrentListId()).toBeNull();
    expect(service.getCurrentMembers()).toEqual([]);
  });

  it('does not apply stale refresh results after a different user load starts', async () => {
    let resolveFirstDb: (value: unknown) => void = () => {};
    const firstDb = new Promise(resolve => {
      resolveFirstDb = resolve;
    });
    let call = 0;
    maybeSingle.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return firstDb;
      }
      return Promise.resolve({ data: { planning_center_list_id: 'list-b' }, error: null });
    });

    vi.mocked(fetchListMembers).mockImplementation(async (listId: string) => {
      if (listId === 'list-a') {
        return { members: [{ id: 'stale', name: 'Stale' }] };
      }
      return { members: [{ id: 'current', name: 'Current' }] };
    });

    const firstLoad = service.loadForUser('user-a@example.com');
    await service.loadForUser('user-b@example.com');

    expect(service.getCurrentListId()).toBe('list-b');
    expect(service.getCurrentMembers()).toEqual([{ id: 'current', name: 'Current' }]);

    resolveFirstDb({ data: { planning_center_list_id: 'list-a' }, error: null });
    await firstLoad;

    expect(service.getCurrentListId()).toBe('list-b');
    expect(service.getCurrentMembers()).toEqual([{ id: 'current', name: 'Current' }]);
  });

  it('invalidateForUser removes cache and clears in-memory state for that user', () => {
    writeCache('list-1', [{ id: 'm1', name: 'Alice' }]);
    service['listIdSubject'].next('list-1');
    service['membersSubject'].next([{ id: 'm1', name: 'Alice' }]);
    service['loadedEmail'] = 'user@example.com';

    service.invalidateForUser('user@example.com');

    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    expect(service.getCurrentListId()).toBeNull();
    expect(service.getCurrentMembers()).toEqual([]);
  });
});
